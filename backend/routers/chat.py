from fastapi import APIRouter

from schemas.chat import ChatRequest, ChatResponse
from Services.langchain_services import get_chat_response

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/", response_model=ChatResponse)
def chat_with_ai(request: ChatRequest):
    reply = get_chat_response(request.message, session_id=request.session_id)
    return ChatResponse(reply=reply, session_id=request.session_id)
