from pydantic import BaseModel, ConfigDict, Field
from typing import Optional


class JobBase(BaseModel):
    Title: str = Field(alias="title")
    salary: str | int = Field(default="")
    description: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class JobCreate(JobBase):
    company_id: int


class JobUpdate(BaseModel):
    Title: Optional[str] = Field(None, alias="title")
    salary: Optional[str | int] = None
    description: Optional[str] = None
    company_id: Optional[int] = None

    model_config = ConfigDict(populate_by_name=True)


class JobResponse(BaseModel):
    id: int
    Title: str = Field(alias="title")
    salary: str | int
    description: Optional[str] = None
    company_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
