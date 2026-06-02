import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.scrapers.inference_scrape import INSTITUTION_UF, REGION_BY_UF, save_outputs


REGION_VALUE_MAP = {
    "North": "Norte",
    "Northeast": "Nordeste",
    "Central-West": "Centro-Oeste",
    "Center-West": "Centro-Oeste",
    "Midwest": "Centro-Oeste",
    "Southeast": "Sudeste",
    "South": "Sul",
}


def normalize_institution_acronym(institution: str | None) -> str:
    return (institution or "").strip().upper()


def ensure_semantic_field(semantic_profile: dict, field_id: str) -> dict:
    field = semantic_profile.get(field_id)

    if not isinstance(field, dict):
        field = {}
        semantic_profile[field_id] = field

    return field


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
        row["semantic_profile"] = semantic_profile
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

        institution = row.get("institution")
        acronym = normalize_institution_acronym(institution)
        mapped_uf = INSTITUTION_UF.get(acronym)
        mapped_region = REGION_BY_UF.get(mapped_uf) if mapped_uf else None
        uf_field = ensure_semantic_field(semantic_profile, "institution_state_uf")
        region_field = ensure_semantic_field(semantic_profile, "institution_region")
        current_uf = uf_field.get("value") or "unknown"
        current_region = region_field.get("value") or "unknown"

        if mapped_uf and current_uf == "unknown":
            uf_field["value"] = mapped_uf
            uf_field["confidence"] = 1
            uf_field["source"] = "rule:normalization"
            uf_field["needs_review"] = False
            uf_field["reason"] = f"UF normalizada pela sigla da instituição: {acronym}."
            changes.append(
                {
                    "name": row.get("name"),
                    "institution": institution,
                    "field": "institution_state_uf",
                    "from": current_uf,
                    "to": mapped_uf,
                }
            )

        if mapped_region and current_region == "unknown":
            region_field["value"] = mapped_region
            region_field["confidence"] = 1
            region_field["source"] = "rule:normalization"
            region_field["needs_review"] = False
            region_field["reason"] = f"Região normalizada a partir da UF {mapped_uf}."
            changes.append(
                {
                    "name": row.get("name"),
                    "institution": institution,
                    "field": "institution_region",
                    "from": current_region,
                    "to": mapped_region,
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
