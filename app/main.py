import json
import os
import subprocess
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.admin import router as admin_router
from app.routers.auth import router as auth_router
from app.routers.chat import router as chat_router
from app.routers.dashboard import router as dashboard_router
from app.routers.legacy_session import router as legacy_session_router
from app.routers.profiles import router as profiles_router


app = FastAPI(title="Agentic API")

CORS_ORIGIN_REGEX = os.getenv(
    "CORS_ORIGIN_REGEX",
    r"^https?://((localhost|127\.0\.0\.1):\d+|[a-zA-Z0-9-]+\.ngrok-free\.app|[a-zA-Z0-9-]+\.ngrok\.app)$",
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(admin_router)
app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(dashboard_router)
app.include_router(legacy_session_router)
app.include_router(profiles_router)


def read_json(path: Path):
    if not path.exists():
        return None

    return json.loads(path.read_text(encoding="utf-8"))


def is_scraping_running() -> bool:
    try:
        result = subprocess.run(
            ["ps", "-eo", "pid=,args="],
            capture_output=True,
            check=True,
            text=True,
        )
    except Exception:
        return False

    scraper_markers = [
        "app/scrapers/pipeline_scrape.py",
        "app/scrapers/lattes_scrape.py",
        "app/scrapers/simple_scrape.py",
    ]

    return any(
        marker in line and "uvicorn" not in line
        for line in result.stdout.splitlines()
        for marker in scraper_markers
    )


@app.get("/")
async def health_check():
    current_path = Path("scrape_results/current.json")
    current = read_json(current_path)
    summary = None

    if current and current.get("summary_json"):
        summary = read_json(Path(current["summary_json"]))

    return {
        "status": "ok",
        "service": "Agentic API",
        "current_data_available": current_path.exists(),
        "current_data_path": str(current_path),
        "scraping_running": is_scraping_running(),
        "active_data": current,
        "active_summary": summary,
    }
