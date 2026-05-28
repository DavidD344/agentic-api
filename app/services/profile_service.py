import csv
import io
import json
from pathlib import Path
from typing import Any


CURRENT_PATH = Path("scrape_results") / "current.json"


PROFILE_LIST_FIELDS = [
    "name",
    "institution",
    "scholarship_level",
    "lattes_code",
    "public_lattes_id",
    "lattes_url",
    "photo_url",
    "orcid",
]

SEMANTIC_LIST_FIELDS = [
    "institution_state_uf",
    "institution_region",
    "scholarship_category",
    "doctorate_year",
    "years_since_doctorate",
    "sex_inferred",
    "main_research_area",
    "research_topics",
    "methods_and_techniques",
    "application_domains",
    "career_stage",
    "academic_rank",
    "seniority_level",
    "has_international_experience",
    "has_industry_experience",
    "has_management_experience",
    "has_editorial_or_event_experience",
    "has_patents_or_software_outputs",
    "profile_summary_short",
    "dashboard_tags",
]


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def semantic_field(profile: dict, field_id: str) -> dict:
    return (profile.get("semantic_profile") or {}).get(field_id) or {}


def semantic_value(profile: dict, field_id: str, default=None):
    return semantic_field(profile, field_id).get("value", default)


def stringify(value) -> str:
    if value is None:
        return ""

    if isinstance(value, (list, dict)):
        return json.dumps(value, ensure_ascii=False)

    return str(value)


def load_active_profiles() -> tuple[dict, list[dict]]:
    if not CURRENT_PATH.exists():
        raise FileNotFoundError("scrape_results/current.json não encontrado")

    current = read_json(CURRENT_PATH)
    profiles_path = current.get("profiles_with_inferences_json")

    if not profiles_path:
        raise FileNotFoundError("current.json não aponta para profiles_with_inferences_json")

    path = Path(profiles_path)

    if not path.exists():
        raise FileNotFoundError(f"profiles_with_inferences_json não encontrado: {path}")

    return current, read_json(path)


def profile_summary(profile: dict) -> dict:
    semantic = {
        field_id: semantic_value(profile, field_id)
        for field_id in SEMANTIC_LIST_FIELDS
    }

    needs_review = any(
        (field or {}).get("needs_review")
        for field in (profile.get("semantic_profile") or {}).values()
    )

    return {
        **{field_id: profile.get(field_id) for field_id in PROFILE_LIST_FIELDS},
        "needs_review": needs_review,
        "semantic": semantic,
    }


def value_matches(value, expected: str | None) -> bool:
    if not expected:
        return True

    if value is None:
        return False

    expected_lower = expected.casefold()

    if isinstance(value, list):
        return any(expected_lower in str(item).casefold() for item in value)

    return expected_lower in str(value).casefold()


def profile_matches(
    profile: dict,
    q: str | None = None,
    name: str | None = None,
    institution: str | None = None,
    uf: str | None = None,
    region: str | None = None,
    scholarship_level: str | None = None,
    scholarship_category: str | None = None,
    sex: str | None = None,
    main_area: str | None = None,
    topic: str | None = None,
    needs_review: bool | None = None,
) -> bool:
    summary = profile_summary(profile)

    if q:
        searchable = " ".join(
            stringify(value)
            for value in [
                profile.get("name"),
                profile.get("institution"),
                profile.get("scholarship_level"),
                profile.get("summary"),
                semantic_value(profile, "main_research_area"),
                semantic_value(profile, "research_topics"),
                semantic_value(profile, "application_domains"),
                semantic_value(profile, "dashboard_tags"),
            ]
        )

        if q.casefold() not in searchable.casefold():
            return False

    checks = [
        (profile.get("name"), name),
        (profile.get("institution"), institution),
        (semantic_value(profile, "institution_state_uf"), uf),
        (semantic_value(profile, "institution_region"), region),
        (profile.get("scholarship_level"), scholarship_level),
        (semantic_value(profile, "scholarship_category"), scholarship_category),
        (semantic_value(profile, "sex_inferred"), sex),
        (semantic_value(profile, "main_research_area"), main_area),
        (semantic_value(profile, "research_topics"), topic),
    ]

    if any(not value_matches(value, expected) for value, expected in checks):
        return False

    if needs_review is not None and summary["needs_review"] is not needs_review:
        return False

    return True


def list_profiles(
    q: str | None = None,
    name: str | None = None,
    institution: str | None = None,
    uf: str | None = None,
    region: str | None = None,
    scholarship_level: str | None = None,
    scholarship_category: str | None = None,
    sex: str | None = None,
    main_area: str | None = None,
    topic: str | None = None,
    needs_review: bool | None = None,
    limit: int = 50,
    offset: int = 0,
) -> dict:
    current, profiles = load_active_profiles()
    filtered = [
        profile
        for profile in profiles
        if profile_matches(
            profile,
            q=q,
            name=name,
            institution=institution,
            uf=uf,
            region=region,
            scholarship_level=scholarship_level,
            scholarship_category=scholarship_category,
            sex=sex,
            main_area=main_area,
            topic=topic,
            needs_review=needs_review,
        )
    ]
    page = filtered[offset : offset + limit]

    return {
        "total": len(filtered),
        "limit": limit,
        "offset": offset,
        "items": [profile_summary(profile) for profile in page],
        "current": current,
    }


def find_profile(profile_id: str) -> dict:
    _current, profiles = load_active_profiles()

    for profile in profiles:
        identifiers = [
            profile.get("lattes_code"),
            profile.get("public_lattes_id"),
            profile.get("name"),
        ]

        if any(str(identifier) == profile_id for identifier in identifiers if identifier):
            return profile

    raise FileNotFoundError(f"Perfil não encontrado: {profile_id}")


def export_profiles_csv() -> str:
    _current, profiles = load_active_profiles()
    fieldnames = [
        *PROFILE_LIST_FIELDS,
        *SEMANTIC_LIST_FIELDS,
        "needs_review",
    ]
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()

    for profile in profiles:
        summary = profile_summary(profile)
        row = {
            field_id: summary.get(field_id)
            for field_id in PROFILE_LIST_FIELDS
        }
        row.update(
            {
                field_id: stringify(summary["semantic"].get(field_id))
                for field_id in SEMANTIC_LIST_FIELDS
            }
        )
        row["needs_review"] = summary["needs_review"]
        writer.writerow(row)

    return output.getvalue()
