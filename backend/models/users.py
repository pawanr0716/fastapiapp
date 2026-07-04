from sqlalchemy import Column, Integer, String
from backend.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(255), nullable=False,default="Candidate")  