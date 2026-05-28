import asyncio
from contextlib import redirect_stderr, redirect_stdout
import json
import sys
from datetime import datetime
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.scrapers.inference_scrape import infer_full_profiles
from app.scrapers.lattes_scrape import enrich_full_profiles, enrich_scholarships
from app.scrapers.simple_scrape import DEFAULT_URL, scrape


RESULTS_DIR = Path("scrape_results")
PIPELINE_RESULTS_DIR = Path("scrape_results") / "pipeline"
CURRENT_PATH = RESULTS_DIR / "current.json"
LOGS_DIR = Path("logs")


class TeeStream:
    def __init__(self, *streams):
        self.streams = streams

    def write(self, data: str) -> None:
        for stream in self.streams:
            stream.write(data)

    def flush(self) -> None:
        for stream in self.streams:
            stream.flush()


def create_pipeline_run_dir() -> Path:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    run_dir = PIPELINE_RESULTS_DIR / timestamp
    run_dir.mkdir(parents=True, exist_ok=True)

    return run_dir


def create_log_path() -> Path:
    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    return LOGS_DIR / f"pipeline_{timestamp}.log"


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def build_active_manifest(
    pipeline_run_dir: Path,
    cnpq_run_dir: Path,
    preview_run_dir: Path,
    full_run_dir: Path,
    inference_run_dir: Path | None = None,
    log_path: Path | None = None,
) -> dict:
    now = datetime.now().isoformat(timespec="seconds")

    manifest = {
        "updated_at": now,
        "pipeline_run_dir": str(pipeline_run_dir),
        "cnpq_run_dir": str(cnpq_run_dir),
        "preview_run_dir": str(preview_run_dir),
        "active_full_run": str(full_run_dir),
        "scholarships_csv": str(cnpq_run_dir / "scholarships.csv"),
        "lattes_profiles_csv": str(preview_run_dir / "lattes_profiles.csv"),
        "lattes_full_profiles_csv": str(full_run_dir / "lattes_full_profiles.csv"),
        "lattes_full_profiles_json": str(full_run_dir / "lattes_full_profiles.json"),
        "review_queue_full_csv": str(full_run_dir / "review_queue_full.csv"),
        "summary_json": str(full_run_dir / "summary.json"),
        "log_path": str(log_path) if log_path else None,
    }

    if inference_run_dir:
        manifest.update(
            {
                "inference_run_dir": str(inference_run_dir),
                "profiles_with_inferences_csv": str(
                    inference_run_dir / "profiles_with_inferences.csv"
                ),
                "profiles_with_inferences_json": str(
                    inference_run_dir / "profiles_with_inferences.json"
                ),
                "inference_review_queue_csv": str(
                    inference_run_dir / "inference_review_queue.csv"
                ),
                "inference_summary_json": str(inference_run_dir / "summary.json"),
            }
        )

    return manifest


def validate_full_run(full_run_dir: Path) -> tuple[bool, list[str]]:
    reasons = []
    summary_path = full_run_dir / "summary.json"
    review_queue_path = full_run_dir / "review_queue_full.json"

    if not summary_path.exists():
        reasons.append(f"summary ausente: {summary_path}")
        return False, reasons

    summary = read_json(summary_path)

    if summary.get("error", 0) != 0:
        reasons.append(f"summary.error={summary.get('error')}")

    if summary.get("skipped", 0) != 0:
        reasons.append(f"summary.skipped={summary.get('skipped')}")

    if not (full_run_dir / "lattes_full_profiles.csv").exists():
        reasons.append("lattes_full_profiles.csv ausente")

    if not (full_run_dir / "lattes_full_profiles.json").exists():
        reasons.append("lattes_full_profiles.json ausente")

    if review_queue_path.exists():
        review_queue = read_json(review_queue_path)

        if review_queue:
            reasons.append(f"review_queue_full com {len(review_queue)} item(ns)")

    return not reasons, reasons


def promote_active_run(
    pipeline_run_dir: Path,
    cnpq_run_dir: Path,
    preview_run_dir: Path,
    full_run_dir: Path,
    inference_run_dir: Path | None = None,
    log_path: Path | None = None,
) -> dict:
    manifest = build_active_manifest(
        pipeline_run_dir,
        cnpq_run_dir,
        preview_run_dir,
        full_run_dir,
        inference_run_dir,
        log_path,
    )
    CURRENT_PATH.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    return manifest


async def run_pipeline(limit: int | None = None, log_path: Path | None = None) -> Path:
    pipeline_run_dir = create_pipeline_run_dir()

    print("== Etapa 0: CNPq scholarships ==", flush=True)
    cnpq_run_dir = await scrape(DEFAULT_URL)
    scholarships_csv = cnpq_run_dir / "scholarships.csv"

    print("== Etapa 1: Lattes preview ==", flush=True)
    preview_run_dir = await enrich_scholarships(scholarships_csv, limit=limit)
    profiles_csv = preview_run_dir / "lattes_profiles.csv"

    print("== Etapa 2: Lattes currículo completo ==", flush=True)
    full_run_dir = await enrich_full_profiles(profiles_csv)

    print("== Etapa 3: Inferências ==", flush=True)
    inference_run_dir = infer_full_profiles(full_run_dir / "lattes_full_profiles.json")

    is_valid, validation_reasons = validate_full_run(full_run_dir)
    promoted = False
    active_manifest = None

    if limit is not None:
        validation_reasons.append("run com limit não promove current.json")
    elif is_valid:
        active_manifest = promote_active_run(
            pipeline_run_dir,
            cnpq_run_dir,
            preview_run_dir,
            full_run_dir,
            inference_run_dir,
            log_path,
        )
        promoted = True

    summary = {
        "limit": limit,
        "promoted": promoted,
        "current_json": str(CURRENT_PATH) if promoted else None,
        "log_path": str(log_path) if log_path else None,
        "validation_ok": is_valid,
        "validation_reasons": validation_reasons,
        "cnpq_run_dir": str(cnpq_run_dir),
        "scholarships_csv": str(scholarships_csv),
        "preview_run_dir": str(preview_run_dir),
        "lattes_profiles_csv": str(profiles_csv),
        "full_run_dir": str(full_run_dir),
        "lattes_full_profiles_csv": str(full_run_dir / "lattes_full_profiles.csv"),
        "lattes_full_profiles_json": str(full_run_dir / "lattes_full_profiles.json"),
        "review_queue_full_csv": str(full_run_dir / "review_queue_full.csv"),
        "summary_json": str(full_run_dir / "summary.json"),
        "inference_run_dir": str(inference_run_dir),
        "profiles_with_inferences_csv": str(
            inference_run_dir / "profiles_with_inferences.csv"
        ),
        "profiles_with_inferences_json": str(
            inference_run_dir / "profiles_with_inferences.json"
        ),
        "inference_review_queue_csv": str(
            inference_run_dir / "inference_review_queue.csv"
        ),
        "inference_summary_json": str(inference_run_dir / "summary.json"),
        "active_manifest": active_manifest,
    }
    summary_path = pipeline_run_dir / "pipeline_summary.json"
    summary_path.write_text(
        json.dumps(summary, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print("== Pipeline concluído ==", flush=True)
    print(f"Pipeline summary: {summary_path}", flush=True)
    print(f"Full profiles CSV: {full_run_dir / 'lattes_full_profiles.csv'}", flush=True)
    print(
        f"Profiles with inferences CSV: {inference_run_dir / 'profiles_with_inferences.csv'}",
        flush=True,
    )

    if promoted:
        print(f"Run promovido para ativo: {CURRENT_PATH}", flush=True)
    else:
        print(
            f"Run não promovido: {'; '.join(validation_reasons) or 'validação falhou'}",
            flush=True,
        )

    return pipeline_run_dir


if __name__ == "__main__":
    row_limit = int(sys.argv[1]) if len(sys.argv) > 1 else None
    pipeline_log_path = create_log_path()

    with pipeline_log_path.open("w", encoding="utf-8") as log_file:
        stdout = TeeStream(sys.stdout, log_file)
        stderr = TeeStream(sys.stderr, log_file)

        with redirect_stdout(stdout), redirect_stderr(stderr):
            print(f"Log: {pipeline_log_path}", flush=True)
            asyncio.run(run_pipeline(limit=row_limit, log_path=pipeline_log_path))
