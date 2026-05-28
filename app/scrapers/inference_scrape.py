import csv
import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv


load_dotenv()

RESULTS_DIR = Path("scrape_results") / "inferences"
CURRENT_PATH = Path("scrape_results") / "current.json"
DEFAULT_INFERENCE_MODEL = "gpt-5-nano"
DEFAULT_REPAIR_INFERENCE_MODEL = "gpt-5.4-mini"
DEFAULT_LLM_CONFIDENCE_THRESHOLD = 0.7
DEFAULT_OPENAI_TIMEOUT_SECONDS = 45
DEFAULT_RULE_TEXT_MAX_CHARS = 6000
DEFAULT_SEMANTIC_TEXT_MAX_CHARS = 6000
DEFAULT_EVIDENCE_SNIPPETS_MAX = 14
DEFAULT_EVIDENCE_SNIPPETS_PER_KIND = 2
DEFAULT_EVIDENCE_SNIPPET_CHARS = 650
DEFAULT_LLM_MODE = "split"
TOKEN_CHAR_RATIO = 4

BASE_FIELDS = [
    "name",
    "institution",
    "scholarship_level",
    "lattes_code",
    "lattes_name",
    "lattes_url",
    "photo_url",
]

RULE_FIELD_IDS = [
    "institution_state_uf",
    "institution_region",
    "scholarship_category",
    "scholarship_level_rank",
    "doctorate_year",
    "years_since_doctorate",
    "profile_language",
    "sex_inferred",
]

RULE_FIELD_DEFINITIONS = [
    {
        "id": "institution_state_uf",
        "type": "string",
        "description": "UF da instituição. Valide se a sigla da instituição realmente pertence à UF inferida.",
    },
    {
        "id": "institution_region",
        "type": "enum",
        "description": "Região brasileira derivada da UF da instituição.",
        "allowed_values": ["Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul", "unknown"],
    },
    {
        "id": "scholarship_category",
        "type": "enum",
        "description": "Categoria principal da bolsa derivada do nível CNPq.",
        "allowed_values": ["PQ-1", "PQ-2", "PQ-C", "unknown"],
    },
    {
        "id": "scholarship_level_rank",
        "type": "integer|null",
        "description": "Ranking simples da bolsa: PQ-1=1, PQ-2=2, PQ-C=3.",
    },
    {
        "id": "doctorate_year",
        "type": "integer|null",
        "description": "Ano de conclusão do doutorado. Corrija se o resumo indicar outro ano com mais clareza.",
    },
    {
        "id": "years_since_doctorate",
        "type": "integer|null",
        "description": "Anos desde o doutorado, derivado do ano de doutorado.",
    },
    {
        "id": "profile_language",
        "type": "enum",
        "description": "Idioma predominante do resumo público.",
        "allowed_values": ["pt", "en", "mixed", "unknown"],
    },
    {
        "id": "sex_inferred",
        "type": "enum",
        "description": (
            "Inferência sensível e aproximada de sexo/gênero para análise estatística. "
            "Use male, female ou unknown. Use unknown se houver dúvida."
        ),
        "allowed_values": ["male", "female", "unknown"],
    },
]

LLM_FIELD_DEFINITIONS = [
    {
        "id": "main_research_area",
        "type": "string",
        "description": "Área principal de pesquisa em taxonomia curta.",
        "examples": ["artificial_intelligence", "software_engineering", "databases"],
    },
    {
        "id": "secondary_research_areas",
        "type": "list[string]",
        "description": "Até 4 áreas secundárias de pesquisa.",
    },
    {
        "id": "research_topics",
        "type": "list[string]",
        "description": "Tópicos de pesquisa perguntáveis e úteis para filtros.",
    },
    {
        "id": "methods_and_techniques",
        "type": "list[string]",
        "description": "Métodos, técnicas, tecnologias ou abordagens mencionadas.",
    },
    {
        "id": "application_domains",
        "type": "list[string]",
        "description": "Domínios de aplicação, se houver, como saúde, educação, energia.",
    },
    {
        "id": "career_stage",
        "type": "enum",
        "description": "Estágio de carreira acadêmica.",
        "allowed_values": ["early", "mid", "senior", "very_senior", "emeritus_or_retired", "unknown"],
    },
    {
        "id": "academic_rank",
        "type": "string",
        "description": "Cargo acadêmico inferido, como professor_titular, associado, adjunto.",
    },
    {
        "id": "seniority_level",
        "type": "enum",
        "description": "Senioridade resumida.",
        "allowed_values": ["junior", "mid", "senior", "very_senior", "unknown"],
    },
    {
        "id": "has_international_experience",
        "type": "boolean",
        "description": "Indica experiência internacional acadêmica ou profissional.",
    },
    {
        "id": "international_countries",
        "type": "list[string]",
        "description": "Países estrangeiros citados em formação, pós-doc, visita ou atuação.",
    },
    {
        "id": "has_industry_experience",
        "type": "boolean",
        "description": "Indica experiência em empresas, indústria, P&D privado ou consultoria.",
    },
    {
        "id": "industry_organizations",
        "type": "list[string]",
        "description": "Organizações privadas ou industriais citadas.",
    },
    {
        "id": "has_management_experience",
        "type": "boolean",
        "description": "Indica coordenação, direção, chefia, pró-reitoria, presidência ou gestão.",
    },
    {
        "id": "management_roles",
        "type": "list[string]",
        "description": "Papéis de gestão citados.",
    },
    {
        "id": "has_editorial_or_event_experience",
        "type": "boolean",
        "description": "Indica editoria, comitês, organização de eventos ou sociedades científicas.",
    },
    {
        "id": "has_patents_or_software_outputs",
        "type": "boolean",
        "description": "Indica patente, software, produto tecnológico ou registro similar.",
    },
    {
        "id": "publication_or_output_focus",
        "type": "list[string]",
        "description": "Foco de produção citado, como periódicos, conferências, livros, patentes.",
    },
    {
        "id": "profile_summary_short",
        "type": "string",
        "description": "Resumo curto em uma frase para cards, busca e relatórios.",
    },
    {
        "id": "profile_summary_bullets",
        "type": "list[string]",
        "description": "Até 4 bullets curtos sobre atuação, formação e experiência.",
    },
    {
        "id": "search_keywords",
        "type": "list[string]",
        "description": "Palavras-chave normalizadas para busca e perguntas em linguagem natural.",
    },
    {
        "id": "dashboard_tags",
        "type": "list[string]",
        "description": "Tags curtas para filtros e agrupamentos no dashboard.",
    },
    {
        "id": "chart_suggestions",
        "type": "list[string]",
        "description": "Agrupamentos ou gráficos nos quais este perfil pode aparecer.",
    },
    {
        "id": "data_quality_notes",
        "type": "list[string]",
        "description": "Alertas de dado incompleto, ambíguo ou pobre.",
    },
    {
        "id": "qa_context",
        "type": "string",
        "description": "Texto compacto otimizado para responder perguntas sobre a pessoa.",
    },
]

LLM_FIELD_IDS = [definition["id"] for definition in LLM_FIELD_DEFINITIONS]
SEMANTIC_FIELD_GROUPS = {
    "research": [
        "main_research_area",
        "secondary_research_areas",
        "research_topics",
        "methods_and_techniques",
        "application_domains",
    ],
    "career": [
        "career_stage",
        "academic_rank",
        "seniority_level",
    ],
    "experience_outputs": [
        "has_international_experience",
        "international_countries",
        "has_industry_experience",
        "industry_organizations",
        "has_management_experience",
        "management_roles",
        "has_editorial_or_event_experience",
        "has_patents_or_software_outputs",
        "publication_or_output_focus",
    ],
    "dashboard_qa": [
        "profile_summary_short",
        "profile_summary_bullets",
        "search_keywords",
        "dashboard_tags",
        "chart_suggestions",
        "data_quality_notes",
        "qa_context",
    ],
}
SEMANTIC_FIELD_IDS = RULE_FIELD_IDS + LLM_FIELD_IDS
CSV_FIELDS = BASE_FIELDS + [
    column
    for field_id in SEMANTIC_FIELD_IDS
    for column in [
        f"{field_id}_value",
        f"{field_id}_confidence",
        f"{field_id}_source",
        f"{field_id}_needs_review",
        f"{field_id}_reason",
    ]
]

INSTITUTION_UF = {
    "CEFET-RJ": "RJ",
    "FURG": "RS",
    "IFCE": "CE",
    "ITA": "SP",
    "LNCC": "RJ",
    "PUC-RIO": "RJ",
    "PUCRS": "RS",
    "UCB": "DF",
    "UEM": "PR",
    "UERJ": "RJ",
    "UFABC": "SP",
    "UFAL": "AL",
    "UFAM": "AM",
    "UFBA": "BA",
    "UFC": "CE",
    "UFCG": "PB",
    "UFF": "RJ",
    "UFG": "GO",
    "UFMG": "MG",
    "UFMS": "MS",
    "UFMT": "MT",
    "UFPA": "PA",
    "UFPB": "PB",
    "UFPE": "PE",
    "UFPI": "PI",
    "UFPR": "PR",
    "UFRGS": "RS",
    "UFRJ": "RJ",
    "UFRN": "RN",
    "UFRPE": "PE",
    "UFS": "SE",
    "UFSC": "SC",
    "UFSCAR": "SP",
    "UFSM": "RS",
    "UFU": "MG",
    "UFV": "MG",
    "UNB": "DF",
    "UNICAMP": "SP",
    "UNIFESP": "SP",
    "UNIOESTE": "PR",
    "UNIRIO": "RJ",
    "UNISINOS": "RS",
    "UNESP": "SP",
    "USP": "SP",
    "UTFPR": "PR",
}

REGION_BY_UF = {
    "AC": "Norte",
    "AL": "Nordeste",
    "AM": "Norte",
    "AP": "Norte",
    "BA": "Nordeste",
    "CE": "Nordeste",
    "DF": "Centro-Oeste",
    "ES": "Sudeste",
    "GO": "Centro-Oeste",
    "MA": "Nordeste",
    "MG": "Sudeste",
    "MS": "Centro-Oeste",
    "MT": "Centro-Oeste",
    "PA": "Norte",
    "PB": "Nordeste",
    "PE": "Nordeste",
    "PI": "Nordeste",
    "PR": "Sul",
    "RJ": "Sudeste",
    "RN": "Nordeste",
    "RO": "Norte",
    "RR": "Norte",
    "RS": "Sul",
    "SC": "Sul",
    "SE": "Nordeste",
    "SP": "Sudeste",
    "TO": "Norte",
}

SEX_TEXT_PATTERNS = [
    ("female", 0.94, r"\bprofessora\b", "Resumo usa o termo professora."),
    ("male", 0.94, r"\bprofessor\b", "Resumo usa o termo professor."),
    ("female", 0.92, r"\bpesquisadora\b", "Resumo usa o termo pesquisadora."),
    ("male", 0.92, r"\bpesquisador\b", "Resumo usa o termo pesquisador."),
    ("female", 0.9, r"\bdoutora\b", "Resumo usa o termo doutora."),
    ("male", 0.9, r"\bdoutor\b", "Resumo usa o termo doutor."),
    ("female", 0.88, r"\bgraduada\b", "Resumo usa o termo graduada."),
    ("male", 0.88, r"\bgraduado\b", "Resumo usa o termo graduado."),
]

EVIDENCE_PATTERNS = [
    ("doctorate", r"\b(doutorado|doutor|doutora|ph\.?d)\b"),
    ("postdoc_or_international", r"\b(p[oó]s-doutorado|p[oó]s-doutoramento|visitante|exterior|internacional|canad[aá]|fran[cç]a|reino unido|estados unidos|eua|alemanha|holanda|b[eé]lgica|portugal|espanha|it[aá]lia)\b"),
    ("patent_or_software", r"\b(patente|co-inventor|inventor|programa de computador|produto tecnol[oó]gico|registro de software|software registrado)\b"),
    ("management", r"\b(coordenador|coordena[cç][aã]o|diretor|diretora|chefe|pr[oó]-reitor|presidente|gest[aã]o|comiss[aã]o)\b"),
    ("editorial_or_event", r"\b(editor|editora|editorial|revisor|revisora|evento|confer[eê]ncia|workshop|simp[oó]sio)\b"),
    ("industry", r"\b(ind[uú]stria privada|startup|p&d privado)\b"),
    ("research_area", r"\b([aá]rea|ênfase|atuando principalmente|temas|intelig[eê]ncia artificial|engenharia de software|otimiza[cç][aã]o|banco de dados|redes|seguran[cç]a|bioinform[aá]tica)\b"),
    ("sex_marker", r"\b(professor|professora|pesquisador|pesquisadora|doutor|doutora|graduado|graduada)\b"),
]


def create_run_dir() -> Path:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    run_dir = RESULTS_DIR / timestamp
    run_dir.mkdir(parents=True, exist_ok=True)

    return run_dir


def inferred(value, confidence: float, source: str, reason: str, needs_review: bool = False) -> dict:
    return {
        "value": value,
        "confidence": confidence,
        "source": source,
        "reason": reason,
        "needs_review": needs_review,
    }


def normalize(value: str | None) -> str:
    return " ".join((value or "").split()).casefold()


def detect_language(text: str | None) -> dict:
    normalized = normalize(text)

    if not normalized:
        return inferred("unknown", 0, "rule", "Resumo ausente.", True)

    portuguese_markers = ["possui", "graduação", "mestrado", "doutorado", "professor"]
    english_markers = ["phd", "professor at", "received", "research interests", "currently"]
    pt_score = sum(marker in normalized for marker in portuguese_markers)
    en_score = sum(marker in normalized for marker in english_markers)

    if pt_score and en_score:
        return inferred("mixed", 0.72, "rule", "Resumo contém marcadores em português e inglês.", True)
    if en_score > pt_score:
        return inferred("en", 0.8, "rule", "Resumo contém marcadores em inglês.", False)
    if pt_score:
        return inferred("pt", 0.86, "rule", "Resumo contém marcadores em português.", False)

    return inferred("unknown", 0.2, "rule", "Idioma não ficou claro por regras simples.", True)


def detect_institution_uf(institution: str | None) -> dict:
    acronym = (institution or "").strip().upper()
    uf = INSTITUTION_UF.get(acronym)

    if not uf:
        return inferred("unknown", 0, "rule", f"Instituição sem UF mapeada: {institution}.", True)

    return inferred(uf, 1, "rule", f"UF mapeada pela sigla da instituição: {acronym}.")


def scholarship_category(level: str | None) -> dict:
    value = normalize(level).upper()

    if value.startswith("PQ-1"):
        category = "PQ-1"
        rank = 1
    elif value.startswith("PQ-2"):
        category = "PQ-2"
        rank = 2
    elif value.startswith("PQ-C"):
        category = "PQ-C"
        rank = 3
    else:
        category = "unknown"
        rank = None

    return {
        "scholarship_category": inferred(category, 1 if category != "unknown" else 0, "rule", "Categoria derivada do nível da bolsa."),
        "scholarship_level_rank": inferred(rank, 1 if rank else 0, "rule", "Ranking simples derivado do nível da bolsa."),
    }


def infer_doctorate_year(summary: str | None) -> dict:
    text = summary or ""
    patterns = [
        r"doutorado[^.]{0,180}\((19\d{2}|20\d{2})\)",
        r"ph\.?d[^.]{0,180}\((19\d{2}|20\d{2})\)",
        r"doutor(?:a|ado)?[^.]{0,160}(19\d{2}|20\d{2})",
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)

        if match:
            year = int(match.group(1))
            return inferred(year, 0.88, "rule", "Ano encontrado em trecho de doutorado no resumo.")

    return inferred(None, 0, "rule", "Ano de doutorado não encontrado por regex.", True)


def years_since_doctorate(doctorate_year: dict) -> dict:
    year = doctorate_year.get("value")

    if not year:
        return inferred(None, 0, "rule", "Sem ano de doutorado para calcular tempo.", True)

    years = datetime.now().year - int(year)

    return inferred(years, 1, "rule", "Diferença entre ano atual e ano de doutorado.")


def infer_sex_by_text(profile: dict) -> dict | None:
    text = " ".join(
        [
            profile.get("summary") or "",
            profile.get("lattes_name") or "",
            profile.get("name") or "",
        ]
    ).casefold()
    matches = []

    for label, confidence, pattern, reason in SEX_TEXT_PATTERNS:
        if re.search(pattern, text):
            matches.append(inferred(label, confidence, "rule:lattes_text", reason))

    if not matches:
        return None

    labels = {match["value"] for match in matches}

    if len(labels) > 1:
        return inferred(
            "unknown",
            0,
            "rule:lattes_text",
            "Resumo contém marcadores masculinos e femininos.",
            True,
        )

    return max(matches, key=lambda match: match["confidence"])


def build_rule_profile(profile: dict) -> dict:
    institution_uf = detect_institution_uf(profile.get("institution"))
    region_value = REGION_BY_UF.get(institution_uf["value"])
    doctorate_year = infer_doctorate_year(profile.get("summary"))
    scholarship = scholarship_category(profile.get("scholarship_level"))
    sex = infer_sex_by_text(profile)

    if not sex:
        sex = inferred(
            "unknown",
            0,
            "rule",
            "Sem evidência textual local para inferir sexo.",
            True,
        )

    return {
        "institution_state_uf": institution_uf,
        "institution_region": inferred(
            region_value or "unknown",
            1 if region_value else 0,
            "rule",
            "Região derivada da UF da instituição.",
            not bool(region_value),
        ),
        **scholarship,
        "doctorate_year": doctorate_year,
        "years_since_doctorate": years_since_doctorate(doctorate_year),
        "profile_language": detect_language(profile.get("summary")),
        "sex_inferred": sex,
    }


def llm_payload(profile: dict, include_evidence: bool = False) -> dict:
    summary = profile.get("summary") or ""
    payload = {
        "name": profile.get("name"),
        "lattes_name": profile.get("lattes_name"),
        "institution": profile.get("institution"),
        "scholarship_level": profile.get("scholarship_level"),
        "lattes_url": profile.get("lattes_url"),
        "orcid": profile.get("orcid"),
        "summary_excerpt": build_text_excerpt(
            summary,
            int(os.getenv("INFERENCES_SEMANTIC_TEXT_MAX_CHARS", DEFAULT_SEMANTIC_TEXT_MAX_CHARS)),
        ),
        "sections_available": profile.get("sections_available") or [],
    }

    if include_evidence:
        payload["evidence_snippets"] = extract_evidence_snippets(profile)

    return payload


def extract_evidence_snippets(profile: dict) -> list[dict]:
    text = read_profile_text(profile) or profile.get("summary") or ""
    if not text:
        return []

    max_snippets = int(os.getenv("INFERENCES_EVIDENCE_SNIPPETS_MAX", DEFAULT_EVIDENCE_SNIPPETS_MAX))
    max_per_kind = int(os.getenv("INFERENCES_EVIDENCE_SNIPPETS_PER_KIND", DEFAULT_EVIDENCE_SNIPPETS_PER_KIND))
    snippet_chars = int(os.getenv("INFERENCES_EVIDENCE_SNIPPET_CHARS", DEFAULT_EVIDENCE_SNIPPET_CHARS))
    snippets = []
    seen = set()

    for label, pattern in EVIDENCE_PATTERNS:
        kind_count = 0

        for match in re.finditer(pattern, text, re.IGNORECASE):
            if kind_count >= max_per_kind:
                break

            start = max(0, match.start() - snippet_chars // 2)
            end = min(len(text), match.end() + snippet_chars // 2)
            snippet = " ".join(text[start:end].split())
            key = (label, snippet[:140])

            if key in seen:
                continue

            seen.add(key)
            snippets.append(
                {
                    "kind": label,
                    "matched_text": match.group(0),
                    "snippet": snippet,
                }
            )
            kind_count += 1

            if len(snippets) >= max_snippets:
                return snippets

    return snippets


def read_profile_text(profile: dict) -> str:
    raw_text_path = profile.get("raw_text_path")

    if not raw_text_path:
        return ""

    path = Path(raw_text_path)

    if not path.exists():
        return ""

    return path.read_text(encoding="utf-8", errors="ignore")


def build_text_excerpt(text: str, max_chars: int) -> str:
    if len(text) <= max_chars:
        return text

    head_chars = max_chars // 2
    tail_chars = max_chars - head_chars

    return (
        text[:head_chars]
        + "\n\n[... trecho intermediário omitido ...]\n\n"
        + text[-tail_chars:]
    )


def estimate_tokens(text: str) -> int:
    return max(1, len(text) // TOKEN_CHAR_RATIO)


def schema_for(definitions: list[dict]) -> dict:
    return {
        definition["id"]: {
            "type": definition["type"],
            "description": definition["description"],
            "allowed_values": definition.get("allowed_values"),
            "examples": definition.get("examples"),
        }
        for definition in definitions
    }


def field_definitions_for(field_ids: list[str]) -> list[dict]:
    definitions_by_id = {
        definition["id"]: definition
        for definition in RULE_FIELD_DEFINITIONS + LLM_FIELD_DEFINITIONS
    }

    return [
        definitions_by_id[field_id]
        for field_id in field_ids
        if field_id in definitions_by_id
    ]


def rule_validation_payload(profile: dict) -> dict:
    summary = profile.get("summary") or ""

    return {
        "name": profile.get("name"),
        "lattes_name": profile.get("lattes_name"),
        "institution": profile.get("institution"),
        "scholarship_level": profile.get("scholarship_level"),
        "summary_excerpt": build_text_excerpt(
            summary,
            int(os.getenv("INFERENCES_RULE_TEXT_MAX_CHARS", DEFAULT_RULE_TEXT_MAX_CHARS)),
        ),
    }


def build_rule_validation_prompt(profile: dict, current_semantic_profile: dict) -> str:
    schema = schema_for(RULE_FIELD_DEFINITIONS)

    return (
        "Você valida inferências feitas por regras locais para um dataset acadêmico.\n"
        "Use somente os dados fornecidos. Não invente fatos.\n"
        "Para cada campo permitido, repita o value se a regra estiver correta ou corrija se houver evidência forte.\n"
        "Se houver dúvida, use unknown/null e needs_review=true.\n"
        "Cada campo deve ter value, confidence, reason e needs_review.\n"
        "Mantenha cada reason curta, com no máximo 14 palavras.\n\n"
        "Responda apenas JSON válido neste formato:\n"
        "{"
        "\"fields\":{"
        "\"field_id\":{\"value\":...,\"confidence\":0.0,\"reason\":\"...\",\"needs_review\":false}"
        "}"
        "}\n\n"
        f"Campos permitidos:\n{json.dumps(schema, ensure_ascii=False, indent=2)}\n\n"
        f"Inferências por regra:\n{json.dumps(current_semantic_profile, ensure_ascii=False, indent=2)}\n\n"
        f"Dados do perfil:\n{json.dumps(rule_validation_payload(profile), ensure_ascii=False, indent=2)}"
    )


def build_semantic_generation_prompt(
    profile: dict,
    current_semantic_profile: dict,
    group_name: str,
    field_ids: list[str],
) -> str:
    schema = schema_for(field_definitions_for(field_ids))

    return (
        f"Você gera inferências semânticas estruturadas do grupo {group_name} "
        "para um sistema multiagente "
        "de consulta, dashboard e relatórios sobre bolsistas CNPq de Computação.\n"
        "Use somente os dados fornecidos. Não invente fatos.\n"
        "Use principalmente summary_excerpt para inferir área, tópicos, métodos, experiência, "
        "resumos, palavras-chave e contexto de QA.\n"
        "Use evidence_snippets como evidência prioritária para patente/software, gestão, editoria, "
        "experiência internacional, indústria, doutorado e marcadores de sexo/gênero.\n"
        "Quando não houver evidência suficiente, use null, lista vazia ou unknown com baixa confiança.\n"
        "Você deve retornar TODOS os campos permitidos deste grupo. Não retorne apenas campos preenchidos.\n"
        "Cada campo deve ter value, confidence, reason e needs_review.\n"
        "Mantenha cada reason curta, com no máximo 14 palavras.\n\n"
        "Responda apenas JSON válido neste formato:\n"
        "{"
        "\"fields\":{"
        "\"field_id\":{\"value\":...,\"confidence\":0.0,\"reason\":\"...\",\"needs_review\":false}"
        "}"
        "}\n\n"
        f"Campos permitidos:\n{json.dumps(schema, ensure_ascii=False, indent=2)}\n\n"
        f"Inferências já validadas:\n{json.dumps(current_semantic_profile, ensure_ascii=False, indent=2)}\n\n"
        f"Dados do perfil:\n{json.dumps(llm_payload(profile, include_evidence=group_name == 'experience_outputs'), ensure_ascii=False, indent=2)}"
    )


def build_llm_prompt(profile: dict, current_semantic_profile: dict) -> str:
    schema = schema_for(RULE_FIELD_DEFINITIONS + LLM_FIELD_DEFINITIONS)

    return (
        "Você cria inferências semânticas estruturadas para um sistema multiagente "
        "de consulta, dashboard e relatórios sobre bolsistas CNPq de Computação.\n"
        "Use somente os dados fornecidos. Não invente fatos. Quando não houver "
        "evidência suficiente, use null, lista vazia ou unknown com baixa confiança.\n"
        "Use principalmente summary_excerpt para inferir área, tópicos, métodos, experiência, "
        "resumos, palavras-chave e contexto de QA.\n"
        "As inferências serão usadas para gráficos, filtros e perguntas em linguagem natural.\n"
        "Você também deve validar as inferências feitas por regra local. Se a regra estiver correta, "
        "repita o mesmo value com confiança alta e explique que validou. Se a regra parecer errada, "
        "corrija o value e marque needs_review=true quando a correção não for óbvia.\n"
        "Você deve retornar TODOS os campos permitidos, tanto os campos de regra quanto os campos "
        "semânticos. Não retorne apenas campos alterados.\n"
        "Cada campo deve ter value, confidence, reason e needs_review.\n"
        "Mantenha cada reason curta, com no máximo 18 palavras.\n"
        "confidence deve ir de 0 a 1. needs_review deve ser true para baixa confiança, "
        "ambiguidade ou inferência sensível/demográfica.\n\n"
        "Responda apenas JSON válido neste formato:\n"
        "{"
        "\"fields\":{"
        "\"field_id\":{\"value\":...,\"confidence\":0.0,\"reason\":\"...\",\"needs_review\":false}"
        "}"
        "}\n\n"
        f"Campos permitidos:\n{json.dumps(schema, ensure_ascii=False, indent=2)}\n\n"
        f"Inferências por regra já disponíveis:\n{json.dumps(current_semantic_profile, ensure_ascii=False, indent=2)}\n\n"
        f"Dados do perfil:\n{json.dumps(llm_payload(profile, include_evidence=True), ensure_ascii=False, indent=2)}"
    )


def parse_llm_json_response(content: str) -> dict:
    content = content.strip()

    if content.startswith("```"):
        content = re.sub(r"^```(?:json)?\s*", "", content)
        content = re.sub(r"\s*```$", "", content)

    try:
        return json.loads(content)
    except json.JSONDecodeError:
        repaired = repair_incomplete_json(content)
        if repaired != content:
            return json.loads(repaired)
        raise


def repair_incomplete_json(content: str) -> str:
    stack = []
    in_string = False
    escaped = False

    for char in content:
        if escaped:
            escaped = False
            continue

        if char == "\\" and in_string:
            escaped = True
            continue

        if char == '"':
            in_string = not in_string
            continue

        if in_string:
            continue

        if char in "{[":
            stack.append(char)
        elif char == "}" and stack and stack[-1] == "{":
            stack.pop()
        elif char == "]" and stack and stack[-1] == "[":
            stack.pop()

    closers = {
        "{": "}",
        "[": "]",
    }

    return content + "".join(closers[char] for char in reversed(stack))


def normalize_llm_field(field_id: str, payload: dict, previous_field: dict | None = None) -> dict:
    confidence = float(payload.get("confidence") or 0)
    needs_review = bool(payload.get("needs_review")) or confidence < DEFAULT_LLM_CONFIDENCE_THRESHOLD
    source = "llm"

    if field_id in RULE_FIELD_IDS:
        previous_value = (previous_field or {}).get("value")
        next_value = payload.get("value")
        source = "rule+llm_validated" if previous_value == next_value else "llm_corrected_rule"

    return inferred(
        payload.get("value"),
        confidence,
        source,
        payload.get("reason") or f"Inferência LLM para {field_id}.",
        needs_review,
    )


def call_llm(client, model: str, prompt: str, row: dict, phase: str, allowed_field_ids: list[str]) -> dict:
    output_text = None
    prompt_tokens_estimate = estimate_tokens(prompt)

    try:
        response = client.responses.create(
            model=model,
            input=prompt,
        )
        output_text = response.output_text
        parsed = parse_llm_json_response(output_text)
        fields = parsed.get("fields", {})
        accepted_fields = []
        corrected_rule_fields = []
        validated_rule_fields = []
        missing_fields = [
            field_id
            for field_id in allowed_field_ids
            if field_id not in fields
        ]

        for field_id, payload in fields.items():
            if field_id not in allowed_field_ids or not isinstance(payload, dict):
                continue

            previous_field = row["semantic_profile"].get(field_id)
            normalized_field = normalize_llm_field(field_id, payload, previous_field)
            row["semantic_profile"][field_id] = normalized_field
            accepted_fields.append(field_id)

            if field_id in RULE_FIELD_IDS:
                if normalized_field["source"] == "llm_corrected_rule":
                    corrected_rule_fields.append(field_id)
                else:
                    validated_rule_fields.append(field_id)

        return {
            "phase": phase,
            "name": row.get("name"),
            "model": model,
            "prompt_chars": len(prompt),
            "prompt_tokens_estimate": prompt_tokens_estimate,
            "accepted_fields": accepted_fields,
            "validated_rule_fields": validated_rule_fields,
            "corrected_rule_fields": corrected_rule_fields,
            "missing_fields": missing_fields,
        }
    except Exception as error:
        return {
            "phase": phase,
            "name": row.get("name"),
            "model": model,
            "prompt_chars": len(prompt),
            "prompt_tokens_estimate": prompt_tokens_estimate,
            "error": str(error),
            "raw_output": output_text,
        }


def build_prompt_for_phase(row: dict, phase: str) -> tuple[str, list[str]]:
    if phase == "single_generation" or phase.startswith("repair:single_generation"):
        return build_llm_prompt(row, row["semantic_profile"]), SEMANTIC_FIELD_IDS

    if phase == "rule_validation" or phase.startswith("repair:rule_validation"):
        return build_rule_validation_prompt(row, row["semantic_profile"]), RULE_FIELD_IDS

    if phase.startswith("semantic_generation:"):
        group_name = phase.split(":", 1)[1]
        field_ids = SEMANTIC_FIELD_GROUPS[group_name]
        return (
            build_semantic_generation_prompt(
                row,
                row["semantic_profile"],
                group_name,
                field_ids,
            ),
            field_ids,
        )

    raise ValueError(f"Fase LLM desconhecida: {phase}")


def unresolved_llm_error_count(decisions: list[dict]) -> int:
    return sum(
        1
        for decision in decisions
        if "error" in decision and not decision.get("repaired")
    )


def repair_failed_llm_decisions(client, repair_model: str, rows: list[dict], decisions: list[dict]) -> list[dict]:
    if os.getenv("INFERENCES_DISABLE_REPAIR") == "1":
        return []

    rows_by_name = {row.get("name"): row for row in rows}
    repair_decisions = []

    for decision in decisions:
        if "error" not in decision or decision.get("repaired"):
            continue

        row = rows_by_name.get(decision.get("name"))

        if not row:
            continue

        original_phase = decision.get("phase") or "single_generation"
        prompt, allowed_field_ids = build_prompt_for_phase(row, original_phase)
        repair_decision = call_llm(
            client,
            repair_model,
            prompt,
            row,
            f"repair:{original_phase}",
            allowed_field_ids,
        )
        repair_decision["repairs_error_from"] = original_phase
        repair_decisions.append(repair_decision)

        if "error" not in repair_decision:
            decision["repaired"] = True
            decision["repaired_by_model"] = repair_model
            decision["repair_phase"] = repair_decision["phase"]

    return repair_decisions


def apply_llm_semantics(rows: list[dict], run_dir: Path) -> list[dict]:
    decisions = []

    if os.getenv("INFERENCES_DISABLE_LLM") == "1":
        write_llm_log(run_dir, False, "INFERENCES_DISABLE_LLM=1", decisions)
        return decisions

    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        write_llm_log(run_dir, False, "OPENAI_API_KEY não configurada", decisions)
        return decisions

    try:
        from openai import OpenAI
    except ImportError as error:
        write_llm_log(run_dir, False, f"OpenAI SDK indisponível: {error}", decisions)
        return decisions

    timeout = float(os.getenv("INFERENCES_OPENAI_TIMEOUT_SECONDS", DEFAULT_OPENAI_TIMEOUT_SECONDS))
    client = OpenAI(api_key=api_key, timeout=timeout)
    model = os.getenv("INFERENCES_LLM_MODEL") or os.getenv("LATTES_LLM_MODEL") or DEFAULT_INFERENCE_MODEL
    repair_model = os.getenv("INFERENCES_REPAIR_LLM_MODEL", DEFAULT_REPAIR_INFERENCE_MODEL)
    llm_mode = os.getenv("INFERENCES_LLM_MODE", DEFAULT_LLM_MODE)
    limit = os.getenv("INFERENCES_LLM_LIMIT")
    max_rows = int(limit) if limit else None
    processed = 0

    for row in rows:
        if max_rows is not None and processed >= max_rows:
            break

        processed += 1

        if llm_mode == "single":
            prompt = build_llm_prompt(row, row["semantic_profile"])
            decisions.append(
                call_llm(
                    client,
                    model,
                    prompt,
                    row,
                    "single_generation",
                    SEMANTIC_FIELD_IDS,
                )
            )
            continue

        rule_prompt = build_rule_validation_prompt(row, row["semantic_profile"])
        decisions.append(
            call_llm(
                client,
                model,
                rule_prompt,
                row,
                "rule_validation",
                RULE_FIELD_IDS,
            )
        )

        for group_name, field_ids in SEMANTIC_FIELD_GROUPS.items():
            semantic_prompt = build_semantic_generation_prompt(
                row,
                row["semantic_profile"],
                group_name,
                field_ids,
            )
            decisions.append(
                call_llm(
                    client,
                    model,
                    semantic_prompt,
                    row,
                    f"semantic_generation:{group_name}",
                    field_ids,
                )
            )

    repair_decisions = repair_failed_llm_decisions(client, repair_model, rows, decisions)
    decisions.extend(repair_decisions)

    write_llm_log(run_dir, True, None, decisions, model=model, repair_model=repair_model)

    return decisions


def write_llm_log(
    run_dir: Path,
    enabled: bool,
    reason: str | None,
    decisions: list[dict],
    model: str | None = None,
    repair_model: str | None = None,
) -> None:
    payload = {
        "enabled": enabled,
        "reason": reason,
        "model": model,
        "repair_model": repair_model,
        "mode": os.getenv("INFERENCES_LLM_MODE", DEFAULT_LLM_MODE),
        "rule_field_ids": RULE_FIELD_IDS,
        "semantic_field_ids": LLM_FIELD_IDS,
        "semantic_field_groups": SEMANTIC_FIELD_GROUPS,
        "rule_text_max_chars": int(os.getenv("INFERENCES_RULE_TEXT_MAX_CHARS", DEFAULT_RULE_TEXT_MAX_CHARS)),
        "semantic_text_max_chars": int(os.getenv("INFERENCES_SEMANTIC_TEXT_MAX_CHARS", DEFAULT_SEMANTIC_TEXT_MAX_CHARS)),
        "evidence_snippets_max": int(os.getenv("INFERENCES_EVIDENCE_SNIPPETS_MAX", DEFAULT_EVIDENCE_SNIPPETS_MAX)),
        "evidence_snippets_per_kind": int(os.getenv("INFERENCES_EVIDENCE_SNIPPETS_PER_KIND", DEFAULT_EVIDENCE_SNIPPETS_PER_KIND)),
        "evidence_snippet_chars": int(os.getenv("INFERENCES_EVIDENCE_SNIPPET_CHARS", DEFAULT_EVIDENCE_SNIPPET_CHARS)),
        "token_char_ratio": TOKEN_CHAR_RATIO,
        "llm_error_attempts": sum(1 for decision in decisions if "error" in decision),
        "unresolved_llm_errors": unresolved_llm_error_count(decisions),
        "llm_repair_attempts": sum(1 for decision in decisions if str(decision.get("phase", "")).startswith("repair:")),
        "llm_repair_successes": sum(
            1
            for decision in decisions
            if str(decision.get("phase", "")).startswith("repair:")
            and "error" not in decision
        ),
        "decisions": decisions,
    }
    (run_dir / "inference_llm.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def infer_profile(profile: dict) -> dict:
    return {
        **profile,
        "semantic_profile": build_rule_profile(profile),
    }


def flatten_value(value) -> str:
    if isinstance(value, (list, dict)):
        return json.dumps(value, ensure_ascii=False)
    if value is None:
        return ""

    return str(value)


def flatten_for_csv(row: dict) -> dict:
    flattened = {field: row.get(field, "") for field in BASE_FIELDS}
    semantic_profile = row.get("semantic_profile") or {}

    for field_id in SEMANTIC_FIELD_IDS:
        payload = semantic_profile.get(field_id) or {}
        flattened[f"{field_id}_value"] = flatten_value(payload.get("value"))
        flattened[f"{field_id}_confidence"] = payload.get("confidence", "")
        flattened[f"{field_id}_source"] = payload.get("source", "")
        flattened[f"{field_id}_needs_review"] = payload.get("needs_review", "")
        flattened[f"{field_id}_reason"] = payload.get("reason", "")

    return flattened


def needs_review(row: dict) -> bool:
    semantic_profile = row.get("semantic_profile") or {}

    return any((field or {}).get("needs_review") for field in semantic_profile.values())


def save_outputs(run_dir: Path, source_json: Path, rows: list[dict], llm_decisions: list[dict]) -> None:
    output_json = run_dir / "profiles_with_inferences.json"
    output_csv = run_dir / "profiles_with_inferences.csv"
    review_json = run_dir / "inference_review_queue.json"
    review_csv = run_dir / "inference_review_queue.csv"
    summary_path = run_dir / "summary.json"

    review_rows = [row for row in rows if needs_review(row)]
    output_json.write_text(
        json.dumps(rows, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    with output_csv.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=CSV_FIELDS)
        writer.writeheader()
        writer.writerows(flatten_for_csv(row) for row in rows)

    review_json.write_text(
        json.dumps(review_rows, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    with review_csv.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=CSV_FIELDS)
        writer.writeheader()
        writer.writerows(flatten_for_csv(row) for row in review_rows)

    sex_counts = {}
    area_counts = {}

    for row in rows:
        semantic_profile = row.get("semantic_profile") or {}
        sex = ((semantic_profile.get("sex_inferred") or {}).get("value")) or "unknown"
        area = ((semantic_profile.get("main_research_area") or {}).get("value")) or "unknown"
        sex_counts[sex] = sex_counts.get(sex, 0) + 1
        area_counts[area] = area_counts.get(area, 0) + 1

    token_estimates = {
        "prompt_tokens_total": sum(
            decision.get("prompt_tokens_estimate", 0)
            for decision in llm_decisions
        ),
        "prompt_tokens_by_phase": {},
    }

    for decision in llm_decisions:
        phase = decision.get("phase") or "unknown"
        token_estimates["prompt_tokens_by_phase"][phase] = (
            token_estimates["prompt_tokens_by_phase"].get(phase, 0)
            + decision.get("prompt_tokens_estimate", 0)
        )

    summary = {
        "source_json": str(source_json),
        "total": len(rows),
        "semantic_fields": SEMANTIC_FIELD_IDS,
        "llm_fields": LLM_FIELD_IDS,
        "sex_counts": sex_counts,
        "main_area_counts": area_counts,
        "needs_review": len(review_rows),
        "llm_decisions": len(llm_decisions),
        "llm_errors": unresolved_llm_error_count(llm_decisions),
        "llm_error_attempts": sum(1 for decision in llm_decisions if "error" in decision),
        "llm_repair_attempts": sum(
            1
            for decision in llm_decisions
            if str(decision.get("phase", "")).startswith("repair:")
        ),
        "llm_repair_successes": sum(
            1
            for decision in llm_decisions
            if str(decision.get("phase", "")).startswith("repair:")
            and "error" not in decision
        ),
        "token_estimates": token_estimates,
        "profiles_with_inferences_csv": str(output_csv),
        "profiles_with_inferences_json": str(output_json),
        "inference_review_queue_csv": str(review_csv),
        "inference_review_queue_json": str(review_json),
    }
    summary_path.write_text(
        json.dumps(summary, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def update_current(run_dir: Path) -> None:
    if not CURRENT_PATH.exists():
        return

    current = json.loads(CURRENT_PATH.read_text(encoding="utf-8"))
    current.update(
        {
            "inference_run_dir": str(run_dir),
            "profiles_with_inferences_csv": str(run_dir / "profiles_with_inferences.csv"),
            "profiles_with_inferences_json": str(run_dir / "profiles_with_inferences.json"),
            "inference_review_queue_csv": str(run_dir / "inference_review_queue.csv"),
            "inference_summary_json": str(run_dir / "summary.json"),
        }
    )
    CURRENT_PATH.write_text(
        json.dumps(current, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def infer_full_profiles(source_json: Path, update_current_manifest: bool = False) -> Path:
    run_dir = create_run_dir()
    rows = json.loads(source_json.read_text(encoding="utf-8"))
    inferred_rows = [infer_profile(row) for row in rows]
    llm_decisions = apply_llm_semantics(inferred_rows, run_dir)
    save_outputs(run_dir, source_json, inferred_rows, llm_decisions)

    has_llm_errors = unresolved_llm_error_count(llm_decisions) > 0
    is_limited_run = bool(os.getenv("INFERENCES_LLM_LIMIT"))

    if update_current_manifest and not is_limited_run and not has_llm_errors:
        update_current(run_dir)
    elif update_current_manifest:
        reason = "run limitado" if is_limited_run else "erros na LLM"
        print(f"Current não atualizado: {reason}", flush=True)

    print(f"Results: {run_dir}", flush=True)
    print(f"Profiles with inferences: {run_dir / 'profiles_with_inferences.csv'}", flush=True)
    print(f"Review queue: {run_dir / 'inference_review_queue.csv'}", flush=True)

    return run_dir


def infer_from_current() -> Path:
    current = json.loads(CURRENT_PATH.read_text(encoding="utf-8"))
    source_json = Path(current["lattes_full_profiles_json"])

    return infer_full_profiles(source_json, update_current_manifest=True)


def repair_existing_run(run_dir: Path, update_current_manifest: bool = False) -> Path:
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        raise RuntimeError("OPENAI_API_KEY não configurada")

    try:
        from openai import OpenAI
    except ImportError as error:
        raise RuntimeError(f"OpenAI SDK indisponível: {error}") from error

    summary_path = run_dir / "summary.json"
    llm_path = run_dir / "inference_llm.json"
    profiles_path = run_dir / "profiles_with_inferences.json"

    summary = json.loads(summary_path.read_text(encoding="utf-8"))
    llm_log = json.loads(llm_path.read_text(encoding="utf-8"))
    rows = json.loads(profiles_path.read_text(encoding="utf-8"))
    decisions = llm_log.get("decisions") or []

    timeout = float(os.getenv("INFERENCES_OPENAI_TIMEOUT_SECONDS", DEFAULT_OPENAI_TIMEOUT_SECONDS))
    client = OpenAI(api_key=api_key, timeout=timeout)
    repair_model = os.getenv("INFERENCES_REPAIR_LLM_MODEL", DEFAULT_REPAIR_INFERENCE_MODEL)
    repair_decisions = repair_failed_llm_decisions(client, repair_model, rows, decisions)
    decisions.extend(repair_decisions)

    llm_log["repair_model"] = repair_model
    llm_log["llm_error_attempts"] = sum(1 for decision in decisions if "error" in decision)
    llm_log["unresolved_llm_errors"] = unresolved_llm_error_count(decisions)
    llm_log["llm_repair_attempts"] = sum(
        1
        for decision in decisions
        if str(decision.get("phase", "")).startswith("repair:")
    )
    llm_log["llm_repair_successes"] = sum(
        1
        for decision in decisions
        if str(decision.get("phase", "")).startswith("repair:")
        and "error" not in decision
    )
    llm_log["decisions"] = decisions
    llm_path.write_text(
        json.dumps(llm_log, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    save_outputs(run_dir, Path(summary["source_json"]), rows, decisions)

    if update_current_manifest and unresolved_llm_error_count(decisions) == 0:
        update_current(run_dir)
        print(f"Current atualizado: {CURRENT_PATH}", flush=True)
    elif update_current_manifest:
        print("Current não atualizado: ainda há erros na LLM", flush=True)

    print(f"Repair run: {run_dir}", flush=True)
    print(f"Repair attempts: {len(repair_decisions)}", flush=True)
    print(f"Unresolved LLM errors: {unresolved_llm_error_count(decisions)}", flush=True)

    return run_dir


if __name__ == "__main__":
    command = sys.argv[1] if len(sys.argv) > 1 else "current"

    if command == "current":
        infer_from_current()
    elif command == "full":
        source = Path(sys.argv[2])
        update_current_flag = "--update-current" in sys.argv[3:]
        infer_full_profiles(source, update_current_manifest=update_current_flag)
    elif command == "repair-errors":
        run_dir = Path(sys.argv[2])
        update_current_flag = "--update-current" in sys.argv[3:]
        repair_existing_run(run_dir, update_current_manifest=update_current_flag)
    else:
        print(f"Unknown command: {command}")
