from fastapi import APIRouter, HTTPException, Depends, status, Request
import logging
import traceback
from sqlalchemy.exc import IntegrityError
import json
import asyncio
from backend.models.idempotency import IdempotencyKey
from backend.schemas.company import CompanyCreate, CompanyUpdate, CompanyResponse
from backend.models.company import Company
from backend.models.job import Job
from sqlalchemy import delete as sqla_delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from backend.database import get_db, SessionLocal
from backend.utils.oauth2 import get_current_user, role_required

router = APIRouter(prefix="/company", tags=["company"])
companies = []

@router.post("/", status_code=status.HTTP_201_CREATED,response_model=CompanyResponse)
async def create_company(company: CompanyCreate, request: Request, db: AsyncSession = Depends(get_db)):
    idempotency_key = None
    try:
        payload = company.dict(exclude_unset=True)
        # Log incoming request for debugging duplicate submissions
        try:
            logging.info("POST /company payload: %s", payload)
            # attempt to log auth header if present
            logging.info("Auth header: %s", request.headers.get("authorization"))
        except Exception:
            logging.debug("Unable to log request headers")

        # idempotency handling
        idempotency_key = request.headers.get("Idempotency-Key") or request.headers.get("idempotency-key")
        if idempotency_key:
            # try to insert a processing marker to claim the key
            try:
                id_entry = IdempotencyKey(key=idempotency_key, status="processing")
                db.add(id_entry)
                await db.commit()
            except IntegrityError:
                # another request is handling this key; poll for completion
                await db.rollback()
                for _ in range(20):
                    result = await db.execute(select(IdempotencyKey).filter(IdempotencyKey.key == idempotency_key))
                    existing = result.scalars().first()
                    if existing and existing.status == "completed":
                        try:
                            return json.loads(existing.response)
                        except Exception:
                            return existing.response
                    await asyncio.sleep(0.1)
                raise HTTPException(status_code=409, detail="Duplicate request in progress")

        db_company = Company(**payload)
        db.add(db_company)
        await db.commit()
        await db.refresh(db_company)

        # build plain response dict (avoid ORM attribute access during serialization)
        response_data = {
            "id": db_company.id,
            "name": db_company.name,
            "email": db_company.email,
            "phone": db_company.phone,
            "location": db_company.location,
            "jobs": [],
        }

        # store idempotency result if key present
        if idempotency_key:
            try:
                # update the idempotency entry
                result = await db.execute(select(IdempotencyKey).filter(IdempotencyKey.key == idempotency_key))
                entry = result.scalars().first()
                if entry:
                    entry.status = "completed"
                    entry.response = json.dumps(response_data)
                    await db.commit()
            except Exception:
                await db.rollback()

        return response_data
    except IntegrityError as ie:
        await db.rollback()
        logging.exception("Integrity error creating company")
        raise HTTPException(status_code=409, detail="Company with provided email or phone already exists")
    except Exception as e:
        await db.rollback()
        logging.exception("Error creating company")
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Error during company creation: {str(e)}")

@router.get("/",status_code=status.HTTP_200_OK, response_model=list[CompanyResponse])
async def get_all_company(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Company).options(selectinload(Company.jobs)))
        companies = result.scalars().all()
        return companies
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error during company retrieval: {str(e)}")    

@router.get("/{company_id}", status_code=status.HTTP_200_OK, response_model=CompanyResponse)
async def get_company(company_id: int, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Company).filter(Company.id == company_id))
        company = result.scalars().first()
        if not company:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Company not found")
        return company
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error during company retrieval: {str(e)}")
 
@router.put("/{company_id}", status_code=status.HTTP_201_CREATED)
async def update_company(company_id: int, company: CompanyUpdate,db: AsyncSession = Depends(get_db),current_user = Depends(get_current_user)):
    try:
        result = await db.execute(select(Company).filter(Company.id == company_id))
        db_company = result.scalars().first()
        if not db_company:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Company not found")
        for key, value in company.dict().items():
            setattr(db_company, key, value)
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Error during company update: {str(e)}")
    await db.refresh(db_company)
    return db_company

@router.delete("/{company_id}", status_code=status.HTTP_200_OK)
async def delete_company(company_id: int,db: AsyncSession = Depends(get_db),current_user = Depends(get_current_user)):
    try:
        result = await db.execute(select(Company).filter(Company.id == company_id))
        db_company = result.scalars().first()
        if not db_company:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Company not found")

        logging.info("User %s deleting company %s", getattr(current_user, 'id', None), company_id)

        # Delete dependent jobs first to avoid FK constraint failures
        try:
            await db.execute(sqla_delete(Job).where(Job.company_id == company_id))
        except Exception:
            logging.exception("Failed to delete jobs for company %s", company_id)

        # Delete the company row
        await db.execute(sqla_delete(Company).where(Company.id == company_id))
        await db.commit()

        # verify deletion
        verify = await db.execute(select(Company).filter(Company.id == company_id))
        still = verify.scalars().first()
        if still:
            logging.error("Company %s still exists after delete attempt", company_id)
            raise HTTPException(status_code=500, detail="Failed to delete company")

        logging.info("Company %s deleted", company_id)
        return {"message": "Company deleted successfully"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Error during company deletion: {str(e)}")

# @router.get("/")
# def read_company():
#     return {"company": "Company root"}

# @router.get("/{company_id}")
# def read_company_by_id(company_id: int):
#     return {"company_id": company_id}