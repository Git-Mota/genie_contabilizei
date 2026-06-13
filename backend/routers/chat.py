import traceback
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.genie import ask_genie

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    question: str
    conversation_id: str | None = None
    mode: str = "normal"


class ChatResponse(BaseModel):
    answer: str
    conversation_id: str
    sql_query: str | None = None
    suggestions: list[str] = []


@router.post("", response_model=ChatResponse)
def chat(body: ChatRequest):
    try:
        answer, sql_query, suggestions, conversation_id = ask_genie(
            body.question,
            body.conversation_id,
            body.mode,
        )
        return ChatResponse(
            answer=answer,
            conversation_id=conversation_id,
            sql_query=sql_query,
            suggestions=suggestions,
        )
    except TimeoutError as e:
        raise HTTPException(status_code=504, detail=str(e))
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
