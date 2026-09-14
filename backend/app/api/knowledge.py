from typing import List, Dict, Any
from fastapi import APIRouter
from app.schemas.schemas import KnowledgeUploadRequest, KnowledgeSearchResult
from app.services.rag.rag_engine import rag_engine

router = APIRouter(prefix="/knowledge", tags=["RAG Knowledge Base"])


@router.get("", response_model=List[Dict[str, Any]])
async def list_knowledge_documents():
    return rag_engine.documents


@router.post("/upload")
async def upload_knowledge_document(req: KnowledgeUploadRequest):
    new_doc = rag_engine.add_document(
        title=req.title,
        content=req.content,
        category=req.category,
        source=req.source,
    )
    return {
        "success": True,
        "message": f"Document '{req.title}' successfully parsed, chunked, and indexed into vector store.",
        "document": new_doc,
    }


@router.post("/search", response_model=List[KnowledgeSearchResult])
async def search_knowledge(query: str):
    results = rag_engine.search(query, top_k=5)
    return [
        KnowledgeSearchResult(
            document_id=r["document_id"],
            title=r["title"],
            category=r["category"],
            chunk_content=r["chunk_content"],
            relevance_score=r["relevance_score"],
            source=r["source"],
        )
        for r in results
    ]
