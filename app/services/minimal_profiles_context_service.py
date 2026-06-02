import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.services.profile_service import load_active_profiles, semantic_value


SEARCH_DIR = Path("scrape_results") / "search"
MINIMAL_PROFILES_JSON_PATH = SEARCH_DIR / "minimal_profiles_context.json"
MINIMAL_PROFILES_TEXT_PATH = SEARCH_DIR / "minimal_profiles_context.txt"


def first_name(name: str | None) -> str:
    if not name:
        return ""

    return name.strip().split()[0]


def build_minimal_profiles_context() -> list[dict]:
    _current, profiles = load_active_profiles()
    records = []

    for profile in profiles:
        name = profile.get("name") or ""
        records.append(
            {
                "name": name,
                "first_name": first_name(name),
                "sex_inferred": semantic_value(profile, "sex_inferred", "unknown"),
                "institution": profile.get("institution"),
                "scholarship_level": profile.get("scholarship_level"),
                "scholarship_category": semantic_value(profile, "scholarship_category", "unknown"),
                "institution_state_uf": semantic_value(profile, "institution_state_uf", "unknown"),
                "institution_region": semantic_value(profile, "institution_region", "unknown"),
            }
        )

    SEARCH_DIR.mkdir(parents=True, exist_ok=True)
    MINIMAL_PROFILES_JSON_PATH.write_text(
        json.dumps(records, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    MINIMAL_PROFILES_TEXT_PATH.write_text(
        format_minimal_profiles_context(records),
        encoding="utf-8",
    )

    return records


def format_minimal_profiles_context(records: list[dict]) -> str:
    lines = [
        "LISTA COMPACTA DE PERFIS",
        "Cada linha tem: nome | primeiro_nome | sexo_inferido | instituição | bolsa | categoria_bolsa | UF | região",
    ]

    for record in records:
        lines.append(
            " | ".join(
                [
                    str(record.get("name") or ""),
                    str(record.get("first_name") or ""),
                    str(record.get("sex_inferred") or "unknown"),
                    str(record.get("institution") or "unknown"),
                    str(record.get("scholarship_level") or "unknown"),
                    str(record.get("scholarship_category") or "unknown"),
                    str(record.get("institution_state_uf") or "unknown"),
                    str(record.get("institution_region") or "unknown"),
                ]
            )
        )

    return "\n".join(lines)


def load_minimal_profiles_context_text() -> str:
    if not MINIMAL_PROFILES_TEXT_PATH.exists():
        build_minimal_profiles_context()

    return MINIMAL_PROFILES_TEXT_PATH.read_text(encoding="utf-8")


if __name__ == "__main__":
    records = build_minimal_profiles_context()
    print(
        json.dumps(
            {
                "profiles": len(records),
                "json_path": str(MINIMAL_PROFILES_JSON_PATH),
                "text_path": str(MINIMAL_PROFILES_TEXT_PATH),
            },
            ensure_ascii=False,
            indent=2,
        )
    )
