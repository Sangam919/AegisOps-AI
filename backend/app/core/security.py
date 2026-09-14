from datetime import datetime, timedelta
from typing import Optional, Any, Dict, List
import re
import jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings
from app.core.logging import logger

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security_bearer = HTTPBearer(auto_error=False)

# Prompt injection & jailbreak patterns for AI safety layer
SUSPICIOUS_PATTERNS = [
    r"ignore (all )?(previous|prior) (instructions|prompts|rules)",
    r"disregard (all )?(previous|prior) (instructions|prompts)",
    r"you are now (in )?developer mode",
    r"system override",
    r"dan mode",
    r"bypass (all )?filters",
    r"reveal (the |your )?(system prompt|hidden instructions|secret)",
    r"execute (shell|bash|powershell|cmd|system) command",
    r"rm -rf",
    r"drop (table|database)",
    r"curl http://",
    r"wget http://",
    r"<script>",
    r"base64 -d",
]

COMPILED_PATTERNS = [re.compile(p, re.IGNORECASE) for p in SUSPICIOUS_PATTERNS]


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def detect_prompt_injection(prompt: str) -> Dict[str, Any]:
    """
    Analyzes prompt text against safety patterns.
    Returns: {"safe": bool, "detected_patterns": List[str], "risk_score": float}
    """
    matched = []
    for pattern in COMPILED_PATTERNS:
        if pattern.search(prompt):
            matched.append(pattern.pattern)

    risk_score = min(1.0, len(matched) * 0.45)
    is_safe = len(matched) == 0

    if not is_safe:
        logger.warning(
            f"SECURITY ALERT: Potential prompt injection intercepted. "
            f"Patterns: {matched}, Score: {risk_score:.2f}"
        )

    return {
        "safe": is_safe,
        "risk_score": risk_score,
        "detected_patterns": matched,
    }
