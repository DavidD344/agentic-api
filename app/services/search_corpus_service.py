import hashlib
import json
from datetime import datetime
from pathlib import Path
from typing import Any


CURRENT_PATH = Path("scrape_results") / "current.json"
SEARCH_DIR = Path("scrape_results") / "search"
CORPUS_PATH = SEARCH_DIR / "profiles_search_corpus.json"
CORPUS_METADATA_PATH = SEARCH_DIR / "profiles_search_corpus_metadata.json"


SEARCH_FIELDS = [
    "institution_state_uf",
    "institution_region",
    "scholarship_category",
    "doctorate_year",
    "years_since_doctorate",
    "sex_inferred",
    "main_research_area",
    "secondary_research_areas",
    "research_topics",
    "methods_and_techniques",
    "application_domains",
    "career_stage",
    "academic_rank",
    "seniority_level",
    "has_international_experience",
    "international_countries",
    "has_industry_experience",
    "industry_organizations",
    "has_management_experience",
    "management_roles",
    "has_editorial_or_event_experience",
    "has_patents_or_software_outputs",
    "publication_or_output_focus",
    "profile_summary_short",
    "profile_summary_bullets",
    "search_keywords",
    "dashboard_tags",
    "qa_context",
]


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()

    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)

    return digest.hexdigest()


def semantic_value(profile: dict, field_id: str, default=None):
    field = (profile.get("semantic_profile") or {}).get(field_id) or {}

    return field.get("value", default)


def compact_semantic_profile(profile: dict) -> dict:
    return {
        field_id: semantic_value(profile, field_id)
        for field_id in SEARCH_FIELDS
    }


def join_list(value) -> str:
    if isinstance(value, list):
        return ", ".join(str(item) for item in value if item not in (None, ""))

    if value is None:
        return ""

    return str(value)


def build_search_text(profile: dict, semantic: dict) -> str:
    lines = [
        f"Nome: {profile.get('name')}",
        f"Instituição: {profile.get('institution')}",
        f"UF: {semantic.get('institution_state_uf')}",
        f"Região: {semantic.get('institution_region')}",
        f"Bolsa: {profile.get('scholarship_level')}",
        f"Categoria da bolsa: {semantic.get('scholarship_category')}",
        f"Lattes: {profile.get('lattes_url')}",
        f"Sexo inferido: {semantic.get('sex_inferred')}",
        f"Ano do doutorado: {semantic.get('doctorate_year')}",
        f"Anos desde o doutorado: {semantic.get('years_since_doctorate')}",
        f"Área principal: {semantic.get('main_research_area')}",
        f"Áreas secundárias: {join_list(semantic.get('secondary_research_areas'))}",
        f"Tópicos de pesquisa: {join_list(semantic.get('research_topics'))}",
        f"Métodos e técnicas: {join_list(semantic.get('methods_and_techniques'))}",
        f"Domínios de aplicação: {join_list(semantic.get('application_domains'))}",
        f"Estágio de carreira: {semantic.get('career_stage')}",
        f"Cargo acadêmico: {semantic.get('academic_rank')}",
        f"Senioridade: {semantic.get('seniority_level')}",
        f"Experiência internacional: {semantic.get('has_international_experience')}",
        f"Países internacionais: {join_list(semantic.get('international_countries'))}",
        f"Experiência com indústria: {semantic.get('has_industry_experience')}",
        f"Organizações da indústria: {join_list(semantic.get('industry_organizations'))}",
        f"Experiência de gestão: {semantic.get('has_management_experience')}",
        f"Papéis de gestão: {join_list(semantic.get('management_roles'))}",
        f"Experiência editorial/eventos: {semantic.get('has_editorial_or_event_experience')}",
        f"Patentes/software/produção tecnológica: {semantic.get('has_patents_or_software_outputs')}",
        f"Foco de publicações/produção: {join_list(semantic.get('publication_or_output_focus'))}",
        f"Resumo curto: {semantic.get('profile_summary_short')}",
        f"Resumo em bullets: {join_list(semantic.get('profile_summary_bullets'))}",
        f"Palavras-chave: {join_list(semantic.get('search_keywords'))}",
        f"Tags de dashboard: {join_list(semantic.get('dashboard_tags'))}",
        f"Contexto para perguntas: {semantic.get('qa_context')}",
    ]

    return "\n".join(line for line in lines if not line.endswith(": None") and not line.endswith(": "))


def profile_to_corpus_record(profile: dict) -> dict:
    semantic = compact_semantic_profile(profile)

    return {
        "name": profile.get("name"),
        "institution": profile.get("institution"),
        "scholarship_level": profile.get("scholarship_level"),
        "lattes_code": profile.get("lattes_code"),
        "lattes_url": profile.get("lattes_url"),
        "photo_url": profile.get("photo_url"),
        "orcid": profile.get("orcid"),
        "semantic_profile": semantic,
        "search_text": build_search_text(profile, semantic),
    }


def build_search_corpus() -> dict:
    if not CURRENT_PATH.exists():
        raise FileNotFoundError("scrape_results/current.json não encontrado")

    current = read_json(CURRENT_PATH)
    profiles_path = current.get("profiles_with_inferences_json")

    if not profiles_path:
        raise FileNotFoundError("current.json não aponta para profiles_with_inferences_json")

    profiles_file = Path(profiles_path)

    if not profiles_file.exists():
        raise FileNotFoundError(f"profiles_with_inferences_json não encontrado: {profiles_file}")

    profiles = read_json(profiles_file)
    records = [profile_to_corpus_record(profile) for profile in profiles]

    SEARCH_DIR.mkdir(parents=True, exist_ok=True)

    CORPUS_PATH.write_text(
        json.dumps(records, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    metadata = {
        "created_at": datetime.now().isoformat(timespec="seconds"),
        "source_profiles_json": str(profiles_file),
        "corpus_path": str(CORPUS_PATH),
        "records_count": len(records),
        "bytes": CORPUS_PATH.stat().st_size,
        "sha256": file_sha256(CORPUS_PATH),
        "fields": SEARCH_FIELDS,
    }
    write_json(CORPUS_METADATA_PATH, metadata)

    return metadata


def get_search_corpus_metadata() -> dict | None:
    if not CORPUS_METADATA_PATH.exists():
        return None

    return read_json(CORPUS_METADATA_PATH)
