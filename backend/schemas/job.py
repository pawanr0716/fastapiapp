from pydantic import BaseModel

from typing import Optional



class JobBase(BaseModel):

    title: str

    salary: int

    description: Optional[str] = None



class JobCreate(JobBase):

    company_id: int



class JobUpdate(BaseModel):

    title: Optional[str] = None

    salary: Optional[int] = None

    description: Optional[str] = None

    company_id: Optional[int] = None



class JobResponse(JobBase):

    id: int

    company_id: Optional[int] = None



    class Config:

        from_attributes = True
