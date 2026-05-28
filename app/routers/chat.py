from fastapi import APIRouter, HTTPException

from app.models.chat import (
    AskChatRequest,
    CreateChatSessionRequest,
    SyncVectorStoreRequest,
    UpdateChatSessionRequest,
)
from app.services.chat_service import ask_chat
from app.services.chat_storage_service import (
    create_session,
    delete_session,
    get_session,
    list_sessions,
    update_session_title,
)
from app.services.openai_vector_store_service import (
    ensure_vector_store,
    get_vector_store_metadata,
)
from app.services.search_corpus_service import build_search_corpus, get_search_corpus_metadata


router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/corpus/rebuild")
async def rebuild_search_corpus():
    try:
        return build_search_corpus()
    except FileNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/corpus")
async def get_search_corpus():
    metadata = get_search_corpus_metadata()

    if not metadata:
        raise HTTPException(status_code=404, detail="Corpus de busca ainda não foi gerado")

    return metadata


@router.post("/vector-store/sync")
async def sync_vector_store(request: SyncVectorStoreRequest):
    try:
        return ensure_vector_store(force_upload=request.force_upload)
    except FileNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/vector-store")
async def get_vector_store():
    metadata = get_vector_store_metadata()

    if not metadata:
        raise HTTPException(status_code=404, detail="Vector store ainda não foi configurado")

    return metadata


@router.post("/sessions")
async def post_session(request: CreateChatSessionRequest):
    return create_session(request.title)


@router.get("/sessions")
async def get_sessions():
    return {
        "sessions": list_sessions(),
    }


@router.get("/sessions/{session_id}")
async def get_chat_session(session_id: str):
    try:
        return get_session(session_id)
    except FileNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/sessions/{session_id}")
async def patch_chat_session(session_id: str, request: UpdateChatSessionRequest):
    try:
        return update_session_title(session_id, request.title)
    except FileNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.delete("/sessions/{session_id}")
async def delete_chat_session(session_id: str):
    try:
        return delete_session(session_id)
    except FileNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/sessions/{session_id}/ask")
async def ask_chat_session(session_id: str, request: AskChatRequest):
    try:
        return ask_chat(
            session_id=session_id,
            question=request.question,
            max_num_results=request.max_num_results,
        )
    except FileNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
