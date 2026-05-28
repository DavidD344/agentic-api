import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.scrapers.inference_scrape import save_outputs


REGION_VALUE_MAP = {
    "North": "Norte",
    "Northeast": "Nordeste",
    "Central-West": "Centro-Oeste",
    "Center-West": "Centro-Oeste",
    "Midwest": "Centro-Oeste",
    "Southeast": "Sudeste",
    "South": "Sul",
}


def normalize_inference_run(run_dir: Path) -> None:
    profiles_path = run_dir / "profiles_with_inferences.json"
    summary_path = run_dir / "summary.json"
    llm_path = run_dir / "inference_llm.json"

    rows = json.loads(profiles_path.read_text(encoding="utf-8"))
    summary = json.loads(summary_path.read_text(encoding="utf-8"))
    llm_log = json.loads(llm_path.read_text(encoding="utf-8"))
    changes = []

    for row in rows:
        semantic_profile = row.get("semantic_profile") or {}
        region = semantic_profile.get("institution_region") or {}
        value = region.get("value")
        normalized_value = REGION_VALUE_MAP.get(value)

        if normalized_value:
            region["value"] = normalized_value
            region["reason"] = f"Normalizado de {value} para {normalized_value}."
            changes.append(
                {
                    "name": row.get("name"),
                    "field": "institution_region",
                    "from": value,
                    "to": normalized_value,
                }
            )

    save_outputs(
        run_dir,
        Path(summary["source_json"]),
        rows,
        llm_log.get("decisions") or [],
    )
    (run_dir / "normalization_log.json").write_text(
        json.dumps(
            {
                "changes_count": len(changes),
                "changes": changes,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    print(f"Run normalizada: {run_dir}", flush=True)
    print(f"Alterações: {len(changes)}", flush=True)
    print(f"Log: {run_dir / 'normalization_log.json'}", flush=True)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python app/scrapers/normalize_inferences.py <run_dir>")
        raise SystemExit(1)

    normalize_inference_run(Path(sys.argv[1]))
