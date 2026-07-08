from os import name

from django import db
from django import db
from fastapi import APIRouter, HTTPException, Depends, status
from backend.schemas.company import CompanyCreate, CompanyUpdate, CompanyResponse
from backend.models.company import Company
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from backend.database import get_db, SessionLocal
from backend.utils.oauth2 import get_current_user, role_required

router = APIRouter(prefix="/company", tags=["company"])
companies = []

@router.post("/", status_code=status.HTTP_201_CREATED,response_model=CompanyResponse)
async def create_company(company: CompanyCreate, db: AsyncSession = Depends(get_db),current_user = Depends(get_current_user)):
    try:
        db_company = Company(**company.dict())
        db.add(db_company)
        await db.commit()
        await db.refresh(db_company)
        return db_company
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Error during company creation: {str(e)}")

@router.get("/",status_code=status.HTTP_200_OK, response_model=list[CompanyResponse])
async def get_all_company(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Company))
        options(selectinload(Company.jobs))
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

@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_company(company_id: int,db: AsyncSession = Depends(get_db),current_user = Depends(get_current_user)):
    try:
        result = await db.execute(select(Company).filter(Company.id == company_id))
        db_company = result.scalars().first()
        if not db_company:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Company not found")
        await db.delete(db_company)
        await db.commit()
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