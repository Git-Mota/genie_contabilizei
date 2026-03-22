from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.genie import ask_genie

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    question: str
    conversation_id: str | None = None


class ChatResponse(BaseModel):
    answer: str
    conversation_id: str


@router.post("", response_model=ChatResponse)
def chat(body: ChatRequest):
    try:
        answer, conversation_id = ask_genie(body.question, body.conversation_id)
        return ChatResponse(answer=answer, conversation_id=conversation_id)
    except TimeoutError as e:
        raise HTTPException(status_code=504, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))