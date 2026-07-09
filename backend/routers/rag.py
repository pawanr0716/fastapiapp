from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.schemas.rag import (
    ResumeRequest, ResumeResponse,
    JobMatchRequest, JobMatchResponse, JobMatchResult,
    RagSearchRequest, RagSearchResponse,
    EmbedResponse,
    JobSearchRequest, SemanticSearchResponse, SemanticSearchResult
)
from backend.Services.resume_service import analyse_resume
from backend.Services.qdrant_service import embeded_all_jobs, search_jobs, match_jobs_for_profile
from backend.Services.rag_service import rag_job_search

router = APIRouter(prefix="/rag", tags=["RAG"])


@router.post("/embed-jobs", response_model=EmbedResponse)
def embed_jobs(db: Session = Depends(get_db)):
    count = embeded_all_jobs(db)
    return EmbedResponse(message=f"Embedded {count} jobs into Qdrant", count=count)


@router.post("/search", response_model=SemanticSearchResponse)
def semantic_search(request: JobSearchRequest):
    results = search_jobs(request.query, top_k=5)
    return SemanticSearchResponse(
        results=[SemanticSearchResult(**r) for r in results]
    )


@router.post("/ask", response_model=RagSearchResponse)
def rag_ask(request: RagSearchRequest):
    answer = rag_job_search(request.question)
    return RagSearchResponse(answer=answer)


@router.post("/analyse-resume", response_model=ResumeResponse)
def resume_analyse(request: ResumeRequest):
    analysis = analyse_resume(request.resume_text)
    return ResumeResponse(analysis=analysis)


@router.post("/ocr")
async def ocr_resume(file: UploadFile = File(...)):
    """Accept a PDF file, run OCR server-side (pdf2image + pytesseract), and return extracted text."""
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only PDF files are supported")

    data = await file.read()
    try:
        # import heavy libs at runtime to avoid import errors when not installed
        from pdf2image import convert_from_bytes
        import pytesseract
        images = convert_from_bytes(data)
        texts = []
        for img in images:
            txt = pytesseract.image_to_string(img)
            if txt and txt.strip():
                texts.append(txt.strip())
        full_text = "\n\n".join(texts)
        if not full_text:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="No extractable text found in PDF (scanned images).")
        return {"text": full_text}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


@router.post("/job-match", response_model=JobMatchResponse)
def job_match(request: JobMatchRequest):
    results = match_jobs_for_profile(request.skills, request.experience, top_k=5)
    return JobMatchResponse(
        matches=[JobMatchResult(**r) for r in results]
    )


#                     Client
#                       │
#           HTTP POST Request (JSON)
#                       │
#                       ▼
#               FastAPI Router
#                       │
#       ┌───────────────┼──────────────────┐
#       │               │                  │
#       ▼               ▼                  ▼
#  Resume API      Search API        RAG API
#       │               │                  │
#       ▼               ▼                  ▼
#  Resume Service  Qdrant Service    RAG Service
#       │               │                  │
#       ▼               ▼                  ▼
#     Groq          Vector Search     Groq + Qdrant
#                       │
#                       ▼
#               Pydantic Response
#                       │
#                       ▼
#                JSON Response
#                       │
#                       ▼
#                    Frontend