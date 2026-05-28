import json
import os
import time
from datetime import datetime
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from openai import OpenAI

from app.services.search_corpus_service import (
    CORPUS_PATH,
    SEARCH_DIR,
    build_search_corpus,
    file_sha256,
    get_search_corpus_metadata,
)


VECTOR_STORE_METADATA_PATH = SEARCH_DIR / "vector_store.json"
DEFAULT_VECTOR_STORE_NAME = "agentic-api-pesquisadores"


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def get_client() -> OpenAI:
    load_dotenv()

    return OpenAI(
        timeout=float(os.getenv("OPENAI_TIMEOUT_SECONDS", "120")),
    )


def get_vector_store_metadata() -> dict | None:
    if not VECTOR_STORE_METADATA_PATH.exists():
        return None

    return read_json(VECTOR_STORE_METADATA_PATH)


def wait_for_vector_store_file(client: OpenAI, vector_store_id: str, file_id: str) -> Any:
    timeout = float(os.getenv("VECTOR_STORE_INDEX_TIMEOUT_SECONDS", "180"))
    interval = float(os.getenv("VECTOR_STORE_INDEX_POLL_SECONDS", "2"))
    deadline = time.time() + timeout

    while True:
        result = client.vector_stores.files.retrieve(
            vector_store_id=vector_store_id,
            file_id=file_id,
        )

        if result.status in {"completed", "failed", "cancelled"}:
            return result

        if time.time() >= deadline:
            return result

        time.sleep(interval)


def ensure_vector_store(force_upload: bool = False) -> dict:
    corpus_metadata = get_search_corpus_metadata() or build_search_corpus()

    if not CORPUS_PATH.exists():
        corpus_metadata = build_search_corpus()

    corpus_hash = file_sha256(CORPUS_PATH)
    metadata = get_vector_store_metadata() or {}

    if (
        not force_upload
        and metadata.get("vector_store_id")
        and metadata.get("corpus_sha256") == corpus_hash
        and metadata.get("status") == "completed"
    ):
        return metadata | {"reused": True}

    client = get_client()

    vector_store_id = metadata.get("vector_store_id")

    if not vector_store_id:
        vector_store = client.vector_stores.create(
            name=os.getenv("OPENAI_VECTOR_STORE_NAME", DEFAULT_VECTOR_STORE_NAME),
        )
        vector_store_id = vector_store.id

    with CORPUS_PATH.open("rb") as file:
        uploaded_file = client.files.create(
            file=file,
            purpose="assistants",
        )

    vector_store_file = client.vector_stores.files.create(
        vector_store_id=vector_store_id,
        file_id=uploaded_file.id,
    )
    vector_store_file = wait_for_vector_store_file(
        client,
        vector_store_id,
        uploaded_file.id,
    )

    updated = {
        "updated_at": datetime.now().isoformat(timespec="seconds"),
        "vector_store_id": vector_store_id,
        "openai_file_id": uploaded_file.id,
        "corpus_path": str(CORPUS_PATH),
        "corpus_sha256": corpus_hash,
        "corpus_records_count": corpus_metadata.get("records_count"),
        "status": vector_store_file.status,
        "last_error": getattr(vector_store_file, "last_error", None),
        "reused": False,
    }
    write_json(VECTOR_STORE_METADATA_PATH, updated)

    return updated


def require_vector_store_id() -> str:
    metadata = get_vector_store_metadata()

    if not metadata or not metadata.get("vector_store_id"):
        raise FileNotFoundError("Vector store ainda não configurado. Rode /chat/vector-store/sync primeiro.")

    return metadata["vector_store_id"]

