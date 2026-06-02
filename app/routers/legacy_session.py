import asyncio
from typing import AsyncIterator

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.services.chat_service import ask_chat, generate_chat_title
from app.services.chat_storage_service import create_session, get_session, list_sessions


router = APIRouter(prefix="/session", tags=["legacy-session"])


class CreateLegacySessionRequest(BaseModel):
    userId: str | None = None
    content: str | None = None


class CreateLegacyMessageRequest(BaseModel):
    sessionId: str
    userId: str | None = None
    content: str


def legacy_session(session: dict) -> dict:
    return {
        "id": session["id"],
        "userId": "admin",
        "title": session.get("title") or "Nova conversa",
        "chatVersion": "FILE_SEARCH@1.0.0",
        "metadata": {
            "source": "agentic-api",
            "tool": "openai_file_search",
        },
        "createdAt": session.get("created_at"),
        "updatedAt": session.get("updated_at"),
    }


def legacy_message(session_id: str, message: dict) -> dict:
    return {
        "id": message["id"],
        "sessionId": session_id,
        "role": message["role"],
        "content": message["content"],
        "inputTokens": None,
        "outputTokens": None,
        "totalTokens": None,
        "createdAt": message.get("created_at"),
        "updatedAt": message.get("updated_at") or message.get("created_at"),
    }


def sse_event(token: str) -> str:
    lines = token.replace("\r", "").split("\n")

    return "".join(f"data: {line}\n" for line in lines) + "\n"


async def answer_stream(answer: str) -> AsyncIterator[str]:
    for index in range(0, len(answer), 24):
        token = answer[index : index + 24]
        yield sse_event(token)
        await asyncio.sleep(0)

    yield "data: [END]\n\n"


@router.post("")
async def create_legacy_session(request: CreateLegacySessionRequest):
    session = create_session(generate_chat_title(request.content))

    return legacy_session(session)


@router.get("")
async def list_legacy_sessions():
    sessions = []

    for item in list_sessions():
        session = get_session(item["id"])
        sessions.append(legacy_session(session))

    return sessions


@router.get("/{session_id}/message")
async def list_legacy_messages(session_id: str):
    try:
        session = get_session(session_id)
    except FileNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error

    return [
        legacy_message(session_id, message)
        for message in session.get("messages", [])
    ]


@router.post("/{session_id}/message")
async def create_legacy_message(session_id: str, request: CreateLegacyMessageRequest):
    if request.sessionId != session_id:
        raise HTTPException(status_code=400, detail="sessionId incompatível com a URL")

    try:
        result = ask_chat(
            session_id=session_id,
            question=request.content,
            max_num_results=8,
        )
    except FileNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error

    return StreamingResponse(
        answer_stream(result["answer"]),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )
