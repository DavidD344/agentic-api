import json
from datetime import datetime
from pathlib import Path
from uuid import uuid4


CHAT_DIR = Path("scrape_results") / "chat"
SESSIONS_DIR = CHAT_DIR / "sessions"


def now_iso() -> str:
    return datetime.now().isoformat(timespec="seconds")


def write_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def session_path(session_id: str) -> Path:
    return SESSIONS_DIR / f"{session_id}.json"


def list_sessions() -> list[dict]:
    if not SESSIONS_DIR.exists():
        return []

    sessions = []

    for path in sorted(SESSIONS_DIR.glob("*.json")):
        session = read_json(path)
        sessions.append(
            {
                "id": session["id"],
                "title": session["title"],
                "created_at": session["created_at"],
                "updated_at": session["updated_at"],
                "messages_count": len(session.get("messages") or []),
            }
        )

    return sorted(sessions, key=lambda item: item["updated_at"], reverse=True)


def create_session(title: str | None = None) -> dict:
    session_id = str(uuid4())
    timestamp = now_iso()
    session = {
        "id": session_id,
        "title": title or "Nova conversa",
        "created_at": timestamp,
        "updated_at": timestamp,
        "messages": [],
    }
    write_json(session_path(session_id), session)

    return session


def get_session(session_id: str) -> dict:
    path = session_path(session_id)

    if not path.exists():
        raise FileNotFoundError(f"Conversa não encontrada: {session_id}")

    return read_json(path)


def save_session(session: dict) -> dict:
    session["updated_at"] = now_iso()
    write_json(session_path(session["id"]), session)

    return session


def update_session_title(session_id: str, title: str) -> dict:
    session = get_session(session_id)
    session["title"] = title

    return save_session(session)


def delete_session(session_id: str) -> dict:
    path = session_path(session_id)

    if not path.exists():
        raise FileNotFoundError(f"Conversa não encontrada: {session_id}")

    path.unlink()

    return {
        "deleted": True,
        "session_id": session_id,
    }


def append_message(session_id: str, role: str, content: str, metadata: dict | None = None) -> dict:
    session = get_session(session_id)
    message = {
        "id": str(uuid4()),
        "role": role,
        "content": content,
        "created_at": now_iso(),
        "metadata": metadata or {},
    }
    session.setdefault("messages", []).append(message)
    save_session(session)

    return message
