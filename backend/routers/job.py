from fastapi import APIRouter, Depends, HTTPException, status
import logging
import traceback
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from backend.database import get_db
from backend.models.job import Job
from sqlalchemy import delete as sqla_delete
import logging
from backend.models.company import Company
from backend.utils.oauth2 import get_current_user, role_required
from backend.schemas.job import JobCreate, JobUpdate, JobResponse

router = APIRouter(prefix="/job", tags=["job"])


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=JobResponse)
async def create_job(job: JobCreate, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    try:
        result = await db.execute(select(Company).filter(Company.id == job.company_id))
        company = result.scalars().first()
        if not company:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Company not found")
        # Coerce/validate salary to integer before creating DB object
        job_data = job.dict(by_alias=True)
        salary_val = job_data.get("salary")
        if salary_val is not None and salary_val != "":
            if isinstance(salary_val, str):
                salary_val = salary_val.strip()
            try:
                job_data["salary"] = int(salary_val)
            except (ValueError, TypeError):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid salary; must be an integer")
        else:
            job_data["salary"] = None

        db_job = Job(**job_data)
        db.add(db_job)
        await db.commit()
        await db.refresh(db_job)

        response_data = {
            "id": db_job.id,
            "title": db_job.title,
            "salary": db_job.salary,
            "description": db_job.description,
            "company_id": db_job.company_id,
        }
        return response_data
    except IntegrityError as ie:
        await db.rollback()
        logging.exception("IntegrityError creating job")
        raise HTTPException(status_code=409, detail="Integrity error creating job")
    except Exception as e:
        await db.rollback()
        logging.exception("Error creating job")
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Error during job creation: {str(e)}")

@router.get("/", status_code=status.HTTP_200_OK, response_model=list[JobResponse])
async def get_all_job(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Job))
    jobs = result.scalars().all()
    return jobs

@router.get("/{job_id}", status_code=status.HTTP_200_OK, response_model=JobResponse)
async def get_job(job_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Job).filter(Job.id == job_id))
    job = result.scalars().first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Job not found")
    return job

@router.put("/{job_id}", status_code=status.HTTP_201_CREATED, response_model=JobResponse)
async def update_job(job_id: int, job: JobUpdate, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    result = await db.execute(select(Job).filter(Job.id == job_id))
    db_job = result.scalars().first()
    if not db_job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Job not found")
    if job.company_id is not None:
        result = await db.execute(select(Company).filter(Company.id == job.company_id))
        company = result.scalars().first()
        if not company:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Company not found")
    for key, value in job.dict(by_alias=True).items():
        if value is not None:
            if key == "salary":
                # coerce salary to int if provided as string
                if isinstance(value, str):
                    try:
                        coerced = int(value.strip())
                    except (ValueError, TypeError):
                        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid salary; must be an integer")
                    setattr(db_job, key, coerced)
                else:
                    setattr(db_job, key, value)
            else:
                setattr(db_job, key, value)
    await db.commit()
    await db.refresh(db_job)
    return db_job

@router.delete("/{job_id}", status_code=status.HTTP_200_OK)
async def delete_job(job_id: int, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    result = await db.execute(select(Job).filter(Job.id == job_id))
    db_job = result.scalars().first()
    if not db_job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Job not found")

    logging.info("User %s deleting job %s", getattr(current_user, 'id', None), job_id)

    # perform SQL delete
    await db.execute(sqla_delete(Job).where(Job.id == job_id))
    await db.commit()

    # verify deletion
    verify = await db.execute(select(Job).filter(Job.id == job_id))
    still = verify.scalars().first()
    if still:
        logging.error("Job %s still exists after delete attempt", job_id)
        raise HTTPException(status_code=500, detail="Failed to delete job")

    logging.info("Job %s deleted", job_id)
    return {"message": "Job deleted successfully"}




# @router.get("/")
# def read_job():
#     return {"job": "Job root"}

# @router.get("/{job_id}")
# def read_job(job_id: int):
#     return {"job_id": job_id}