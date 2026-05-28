import json
import os
import subprocess
from datetime import datetime
from pathlib import Path


PIPELINE_DIR = Path("scrape_results") / "pipeline"
ADMIN_STATUS_PATH = PIPELINE_DIR / "admin_status.json"
LOGS_DIR = Path("logs")


def now_iso() -> str:
    return datetime.now().isoformat(timespec="seconds")


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def process_is_running(pid: int | None) -> bool:
    if not pid:
        return False

    try:
        os.kill(pid, 0)
    except OSError:
        return False

    return True


def latest_pipeline_summary_path() -> str | None:
    if not PIPELINE_DIR.exists():
        return None

    summaries = sorted(PIPELINE_DIR.glob("*/pipeline_summary.json"))

    if not summaries:
        return None

    return str(summaries[-1])


def latest_log_tail(log_path: str | None, lines: int = 40) -> list[str]:
    if not log_path:
        return []

    path = Path(log_path)

    if not path.exists():
        return []

    return path.read_text(encoding="utf-8", errors="replace").splitlines()[-lines:]


def get_pipeline_status() -> dict:
    status = read_json(ADMIN_STATUS_PATH) if ADMIN_STATUS_PATH.exists() else {}
    pid = status.get("pid")
    running = process_is_running(pid)

    if status and not running and status.get("status") == "running":
        status["status"] = "finished_or_stopped"
        status["finished_detected_at"] = now_iso()
        status["latest_pipeline_summary_json"] = latest_pipeline_summary_path()
        write_json(ADMIN_STATUS_PATH, status)

    return {
        "running": running,
        "status": status.get("status", "idle"),
        "pid": pid,
        "started_at": status.get("started_at"),
        "command": status.get("command"),
        "limit": status.get("limit"),
        "log_path": status.get("log_path"),
        "latest_pipeline_summary_json": status.get("latest_pipeline_summary_json")
        or latest_pipeline_summary_path(),
        "log_tail": latest_log_tail(status.get("log_path")),
    }


def start_pipeline(limit: int | None = None) -> dict:
    current_status = get_pipeline_status()

    if current_status["running"]:
        raise RuntimeError("Pipeline já está rodando")

    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_path = LOGS_DIR / f"pipeline_api_{timestamp}.log"
    command = [
        "env",
        "UV_CACHE_DIR=/tmp/uv-cache",
        "uv",
        "run",
        "python",
        "app/scrapers/pipeline_scrape.py",
    ]

    if limit is not None:
        command.append(str(limit))

    log_file = log_path.open("w", encoding="utf-8")
    process = subprocess.Popen(
        command,
        stdout=log_file,
        stderr=subprocess.STDOUT,
        start_new_session=True,
    )
    log_file.close()

    status = {
        "status": "running",
        "pid": process.pid,
        "started_at": now_iso(),
        "command": command,
        "limit": limit,
        "log_path": str(log_path),
        "latest_pipeline_summary_json": latest_pipeline_summary_path(),
    }
    write_json(ADMIN_STATUS_PATH, status)

    return {
        "started": True,
        **get_pipeline_status(),
    }

