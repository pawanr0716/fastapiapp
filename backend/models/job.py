from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from backend.database import Base
from backend.models.company import Company

class Job(Base):
    __tablename__="jobs"
    id=Column(Integer,primary_key=True,index=True)
    title=Column(String,nullable=False)
    description=Column(String)
    salary=Column(Integer)
    company_id=Column(Integer,ForeignKey("companies.id"))
    company=relationship("Company",back_populates="jobs")
