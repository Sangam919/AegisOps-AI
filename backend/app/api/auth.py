from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.entities import User, UserRole
from app.schemas.schemas import UserCreate, UserResponse, Token, LoginRequest
from app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token, security_bearer
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


async def get_current_user(
    token_creds=Depends(security_bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not token_creds:
        # Default mock admin user for local development convenience if token header absent
        q = select(User).where(User.email == "admin@aegisops.io")
        res = await db.execute(q)
        user = res.scalar_one_or_none()
        if user:
            return user
        # Return fallback memory user
        return User(
            id=1,
            email="admin@aegisops.io",
            full_name="Platform Lead",
            role=UserRole.ADMIN,
            is_active=True,
        )

    payload = decode_access_token(token_creds.credentials)
    email: str = payload.get("sub")
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    q = select(User).where(User.email == email)
    res = await db.execute(q)
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


@router.post("/register", response_model=UserResponse)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    q = select(User).where(User.email == user_in.email)
    res = await db.execute(q)
    existing = res.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    new_user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        role=user_in.role,
        is_active=True,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user


@router.post("/login", response_model=Token)
async def login(login_data: LoginRequest, db: AsyncSession = Depends(get_db)):
    q = select(User).where(User.email == login_data.email)
    res = await db.execute(q)
    user = res.scalar_one_or_none()

    # Predefined demo accounts
    demo_passwords = {"admin@aegisops.io": "admin123", "operator@aegisops.io": "operator123"}
    valid = False
    if user and verify_password(login_data.password, user.hashed_password):
        valid = True
    elif login_data.email in demo_passwords and login_data.password == demo_passwords[login_data.email]:
        valid = True
        if not user:
            user = User(
                id=1 if "admin" in login_data.email else 2,
                email=login_data.email,
                full_name="Operations Lead" if "admin" in login_data.email else "SRE Operator",
                hashed_password=get_password_hash(login_data.password),
                role=UserRole.ADMIN if "admin" in login_data.email else UserRole.OPERATOR,
                is_active=True,
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)

    if not valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    access_token = create_access_token(
        data={"sub": user.email, "role": user.role.value},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
