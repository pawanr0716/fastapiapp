from pydantic import BaseModel
from typing import Optional

from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default"


class ChatResponse(BaseModel):
    reply: str
    session_id: str
