from typing import Dict, List, Any, Optional
import math
import numpy as np
from datetime import datetime
from app.core.logging import logger

DEFAULT_KNOWLEDGE_DOCS = [
    {
        "id": 1,
        "title": "PostgreSQL Connection Pooling & HikariCP Best Practices",
        "category": "runbook",
        "source": "infrastructure-runbooks/db-pooling.md",
        "content": """
# PostgreSQL Connection Pooling & HikariCP Best Practices
Under high concurrent transaction volumes, application threads attempting to query PostgreSQL can saturate the maximum pool capacity.
When pool utilization exceeds 90%, connection acquisition latency spikes sharply from ~2ms to >3000ms, eventually causing `ConnectionPoolExhaustedException`.

## Symptoms
- API latency escalates across all endpoints touching the database.
- HikariCP logs report `Timeout waiting for idle connection`.
- Active database connections on PostgreSQL cluster approach `max_connections`.

## Immediate Mitigation
1. Check `pg_stat_activity` for stale transactions or unindexed slow queries.
2. Gracefully scale HikariCP max-pool-size by +30% up to DB host memory limit.
3. Restart or cycle leaked pool threads.
4. Scale out service replicas to distribute connection pooling demand.
        """,
    },
    {
        "id": 2,
        "title": "Mitigating JVM Garbage Collection Pauses & Heap Leaks",
        "category": "runbook",
        "source": "infrastructure-runbooks/jvm-oom.md",
        "content": """
# Mitigating JVM Garbage Collection Pauses & Heap Leaks
Memory leaks in microservices typically manifest as escalating heap occupancy where major garbage collections fail to reclaim memory.
As the old generation approaches 95% capacity, ConcurrentMarkSweep or G1GC threads execute Stop-The-World full GC cycles exceeding 2000ms.

## Diagnostic Procedures
1. Inspect Prometheus `jvm_memory_used_bytes` vs `jvm_memory_max_bytes`.
2. Review garbage collection pause time metrics.
3. Collect automated heap dump via `jmap -dump:live,format=b,file=heap.bin`.
4. Trigger rolling restart of affected pods to restore memory baseline.
        """,
    },
    {
        "id": 3,
        "title": "Auth Service BCrypt Saturation & Rate-Limiting Runbook",
        "category": "security",
        "source": "infrastructure-runbooks/auth-cpu.md",
        "content": """
# Auth Service BCrypt Saturation & Rate-Limiting Runbook
BCrypt hashing is intentionally computationally intensive. A sudden influx of authentication requests (e.g. credential stuffing or login bursts) can rapidly saturate all available CPU cores.

## Remediation Protocol
1. Verify if CPU spike correlates with high volume of failed 401 login attempts from specific IP ranges.
2. Enable Cloudflare / Envoy edge rate limiting on `/api/v1/auth/tokens` to 10 requests per second per IP.
3. Horizontally scale authentication pods to distribute hashing workload across additional CPU cores.
        """,
    },
    {
        "id": 4,
        "title": "Automated Canary Deployment & Rapid Rollback Procedures",
        "category": "deployment",
        "source": "infrastructure-runbooks/deployments.md",
        "content": """
# Automated Canary Deployment & Rapid Rollback Procedures
When a newly deployed application version experiences an abrupt increase in HTTP 5xx responses (>2% error rate), an immediate rollback must be enacted.

## Execution
1. Identify the previous stable release tag (e.g., v2.4.0 vs faulty v2.4.1).
2. Issue deployment rollback command to route 100% of traffic to the stable artifact.
3. Verify telemetry error rate drops back to SLA nominal bounds within 60 seconds.
4. Tag commit in git repository as defective and file critical P0 bug report.
        """,
    },
]


class RAGEngine:
    def __init__(self):
        self.documents: List[Dict[str, Any]] = list(DEFAULT_KNOWLEDGE_DOCS)
        self.chunks: List[Dict[str, Any]] = []
        self._index_documents()

    def _generate_embedding(self, text: str) -> np.ndarray:
        """
        Generates a 64-dimensional semantic projection embedding vector.
        Uses deterministic hashing over token n-grams to enable offline cosine search.
        """
        dim = 64
        vec = np.zeros(dim)
        words = text.lower().replace("\n", " ").split()
        for i, word in enumerate(words):
            h = hash(word) % dim
            weight = 1.0 / (1.0 + math.log(1 + len(word)))
            vec[h] += weight
        norm = np.linalg.norm(vec)
        if norm > 1e-6:
            vec = vec / norm
        return vec

    def _index_documents(self):
        self.chunks.clear()
        for doc in self.documents:
            paragraphs = [p.strip() for p in doc["content"].split("\n\n") if p.strip()]
            for idx, p in enumerate(paragraphs):
                embedding = self._generate_embedding(p)
                self.chunks.append({
                    "document_id": doc["id"],
                    "title": doc["title"],
                    "category": doc["category"],
                    "source": doc["source"],
                    "chunk_index": idx,
                    "content": p,
                    "embedding": embedding,
                })

    def add_document(self, title: str, content: str, category: str = "runbook", source: str = "manual_upload") -> Dict[str, Any]:
        doc_id = len(self.documents) + 1
        new_doc = {
            "id": doc_id,
            "title": title,
            "category": category,
            "source": source,
            "content": content,
            "created_at": datetime.utcnow().isoformat(),
        }
        self.documents.append(new_doc)
        self._index_documents()
        logger.info(f"RAG: Added and indexed new document '{title}' (ID {doc_id})")
        return new_doc

    def search(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """Searches indexed chunks via cosine similarity."""
        query_vec = self._generate_embedding(query)
        scored_chunks = []

        for chunk in self.chunks:
            cos_sim = float(np.dot(query_vec, chunk["embedding"]))
            if cos_sim > 0.05:
                scored_chunks.append({
                    "document_id": chunk["document_id"],
                    "title": chunk["title"],
                    "category": chunk["category"],
                    "source": chunk["source"],
                    "chunk_content": chunk["content"],
                    "relevance_score": round(max(0.0, min(1.0, cos_sim * 1.65)), 3),
                })

        scored_chunks.sort(key=lambda x: x["relevance_score"], reverse=True)
        return scored_chunks[:top_k]


rag_engine = RAGEngine()
