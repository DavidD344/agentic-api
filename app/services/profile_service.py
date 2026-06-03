import csv
from difflib import SequenceMatcher
import io
import json
import re
import unicodedata
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

SEARCH_ALIASES = {
    "integer programming": ["programacao inteira", "programacao linear inteira", "integer programming"],
    "integer": ["inteira", "inteiro", "integer"],
    "programming": ["programacao", "programming"],
    "mathematical programming": ["programacao matematica", "mathematical programming"],
    "operations research": ["pesquisa operacional", "operations research"],
    "optimization": ["otimizacao", "optimization"],
    "robotics": ["robotica", "robotics"],
    "robotica": ["robotica", "robotics"],
    "mobile robotics": ["robotica movel", "mobile robotics"],
    "robotica movel": ["robotica movel", "mobile robotics"],
    "electronic": ["eletronica", "electronic"],
    "electronics": ["eletronica", "electronics"],
    "eletronica": ["eletronica", "electronic", "electronics"],
    "artificial intelligence": ["inteligencia artificial", "artificial intelligence", "ai"],
    "inteligencia artificial": ["inteligencia artificial", "artificial intelligence", "ai"],
}


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


def normalize_search_text(value: str) -> str:
    without_accents = "".join(
        char
        for char in unicodedata.normalize("NFKD", value.casefold())
        if not unicodedata.combining(char)
    )
    spaced = re.sub(r"[_/\-]+", " ", without_accents)
    cleaned = re.sub(r"[^a-z0-9]+", " ", spaced)
    return re.sub(r"\s+", " ", cleaned).strip()


def search_terms(query: str) -> list[str]:
    normalized = normalize_search_text(query)
    terms = {normalized}

    for source, aliases in SEARCH_ALIASES.items():
        normalized_source = normalize_search_text(source)
        if normalized_source and normalized_source in normalized:
            terms.update(normalize_search_text(alias) for alias in aliases)

    words = normalized.split()
    if len(words) == 1:
        for word in words:
            terms.update(
                normalize_search_text(alias)
                for alias in SEARCH_ALIASES.get(word, [])
            )

    return [term for term in terms if term]


def token_distance(left: str, right: str, max_distance: int) -> int:
    if abs(len(left) - len(right)) > max_distance:
        return max_distance + 1

    previous = list(range(len(right) + 1))

    for left_index, left_char in enumerate(left, start=1):
        current = [left_index]

        for right_index, right_char in enumerate(right, start=1):
            substitution_cost = 0 if left_char == right_char else 1
            current.append(
                min(
                    previous[right_index] + 1,
                    current[right_index - 1] + 1,
                    previous[right_index - 1] + substitution_cost,
                )
            )

        if min(current) > max_distance:
            return max_distance + 1

        previous = current

    return previous[-1]


def fuzzy_token_matches(query_token: str, candidate_token: str) -> bool:
    if not query_token or not candidate_token:
        return False

    if query_token == candidate_token:
        return True

    if len(query_token) <= 2:
        return False

    if candidate_token.startswith(query_token) or query_token.startswith(candidate_token):
        return True

    if len(query_token) < 4:
        return False

    max_distance = 1 if len(query_token) < 7 else 2

    if token_distance(query_token, candidate_token, max_distance) <= max_distance:
        return True

    return SequenceMatcher(None, query_token, candidate_token).ratio() >= 0.82


def fuzzy_tokens_match(haystack_tokens: set[str], query_tokens: list[str]) -> bool:
    if not query_tokens:
        return False

    return all(
        any(fuzzy_token_matches(query_token, candidate_token) for candidate_token in haystack_tokens)
        for query_token in query_tokens
    )


def text_matches(value: str, query: str | None, *, fuzzy: bool = False) -> bool:
    if not query:
        return True

    haystack = normalize_search_text(value)
    if not haystack:
        return False

    haystack_tokens = set(haystack.split())

    for term in search_terms(query):
        if term in haystack:
            return True

        term_tokens = term.split()
        if term_tokens and all(token in haystack_tokens for token in term_tokens):
            return True

        if fuzzy and fuzzy_tokens_match(haystack_tokens, term_tokens):
            return True

    return False


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

    if isinstance(value, list):
        return any(text_matches(str(item), expected) for item in value)

    return text_matches(str(value), expected)


def profile_searchable_text(profile: dict) -> str:
    return " ".join(
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


def profile_search_score(profile: dict, q: str | None) -> int:
    if not q:
        return 0

    name = stringify(profile.get("name"))
    institution = stringify(profile.get("institution"))
    normalized_query = normalize_search_text(q)
    normalized_name = normalize_search_text(name)

    if normalized_query and normalized_query in normalized_name:
        return 100

    if text_matches(name, q, fuzzy=True):
        return 90

    if text_matches(institution, q):
        return 40

    if text_matches(profile_searchable_text(profile), q):
        return 10

    return 0


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
        if profile_search_score(profile, q) <= 0:
            return False

    checks = [
        (profile.get("name"), name, True),
        (profile.get("institution"), institution),
        (semantic_value(profile, "institution_state_uf"), uf),
        (semantic_value(profile, "institution_region"), region),
        (profile.get("scholarship_level"), scholarship_level),
        (semantic_value(profile, "scholarship_category"), scholarship_category),
        (semantic_value(profile, "sex_inferred"), sex),
        (semantic_value(profile, "main_research_area"), main_area),
        (semantic_value(profile, "research_topics"), topic),
    ]

    for check in checks:
        value, expected, *options = check
        fuzzy = bool(options and options[0])

        if expected and fuzzy:
            if not text_matches(str(value), expected, fuzzy=True):
                return False
        elif not value_matches(value, expected):
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

    if q:
        filtered.sort(key=lambda profile: profile_search_score(profile, q), reverse=True)

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
