from os import name

from fastapi import APIRouter, HTTPException, Depends, status
from backend.schemas.company import CompanyCreate, CompanyUpdate, CompanyResponse
from backend.models.company import Company
from sqlalchemy.orm import Session
from backend.database import get_db, SessionLocal
from backend.utils.oauth2 import get_current_user, role_required

router = APIRouter(prefix="/company", tags=["company"])
companies = []

@router.post("/", status_code=status.HTTP_201_CREATED,response_model=CompanyResponse)
def create_company(company: CompanyCreate, db: Session = Depends(get_db),current_user = Depends(role_required(["admin","hr"]))):
    db_company = Company(**company.dict())
    db.add(db_company)
    db.commit()
    db.refresh(db_company)
    return db_company

@router.get("/",status_code=status.HTTP_200_OK, response_model=list[CompanyResponse])
def get_all_company(db: Session = Depends(get_db),current_user = Depends(get_current_user)):
    companies = db.query(Company).all()
    return companies

@router.get("/{company_id}", status_code=status.HTTP_200_OK, response_model=CompanyResponse)
def get_company(company_id: int, db: Session = Depends(get_db),current_user = Depends(get_current_user)):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Company not found")
    return company
 
@router.put("/{company_id}", status_code=status.HTTP_201_CREATED)
def update_company(company_id: int, company: CompanyUpdate,db: Session = Depends(get_db),current_user = Depends(role_required(["admin","hr"]))):
    db_company = db.query(Company).filter(Company.id == company_id).first()
    if not db_company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Company not found")
    for key, value in company.dict().items():
        setattr(db_company, key, value)
    db.commit()
    db.refresh(db_company)
    return db_company

@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_company(company_id: int,db: Session = Depends(get_db),current_user = Depends(role_required(["admin","hr"]))):
    db_company = db.query(Company).filter(Company.id == company_id).first()
    if not db_company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Company not found")
    db.delete(db_company)
    db.commit()
    return {"message": "Company deleted successfully"}

# @router.get("/")
# def read_company():
#     return {"company": "Company root"}

# @router.get("/{company_id}")
# def read_company_by_id(company_id: int):
#     return {"company_id": company_id}