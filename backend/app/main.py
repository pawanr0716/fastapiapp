import sys
from pathlib import Path

# Ensure project root is on sys.path before importing local `backend` package
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from fastapi import FastAPI, Request, Depends
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database import get_db
from backend.models.company import Company
from backend.models.job import Job
from fastapi.middleware.cors import CORSMiddleware

from backend.routers import company, job, auth, chat, rag
from backend.database import engine, Base

app = FastAPI(title="TalentSpark API", version="1.0.0")

# Add CORS middleware to allow frontend communication
app.add_middleware(
    CORSMiddleware,
        # Development: allow all origins and do not allow credentials to avoid wildcard+credentials issues
        allow_origins=["*"],
        allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    from database import engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# Include routers
app.include_router(company.router)
app.include_router(job.router)
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(rag.router)
@app.get("/")
def read_root():
    return {"message": "Welcome to TalentSpark API"}


@app.post("/debug/echo")
async def debug_echo(request: Request):
    try:
        body = await request.json()
    except Exception:
        body = None
    return {"method": request.method, "headers": dict(request.headers), "body": body}


@app.get("/debug/db-rows")
async def debug_db_rows(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Company).options(selectinload(Company.jobs)))
    companies = result.scalars().all()
    result2 = await db.execute(select(Job))
    jobs = result2.scalars().all()

    # Convert ORM objects to plain dicts to avoid lazy-loading during serialization
    companies_data = []
    for c in companies:
        companies_data.append({
            "id": c.id,
            "name": c.name,
            "email": c.email,
            "phone": c.phone,
            "location": c.location,
            "jobs": [
                {"id": j.id, "title": j.title, "company_id": j.company_id} for j in getattr(c, "jobs", [])
            ],
        })

    jobs_data = [{"id": j.id, "title": j.title, "company_id": j.company_id} for j in jobs]

    return {"companies": companies_data, "jobs": jobs_data}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)