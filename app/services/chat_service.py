import json
import os
import re
from collections import Counter
from unicodedata import normalize as unicode_normalize

from dotenv import load_dotenv
from openai import OpenAI

from app.services.chat_storage_service import append_message, get_session
from app.services.dashboard_service import build_dashboard_metrics
from app.services.minimal_profiles_context_service import load_minimal_profiles_context_text
from app.services.openai_vector_store_service import require_vector_store_id
from app.services.profile_service import load_active_profiles, semantic_value


DEFAULT_CHAT_MODEL = "gpt-5.4-mini"
DEFAULT_PLANNER_MODEL = "gpt-5.4-mini"
DEFAULT_TITLE_MODEL = "gpt-5.4-nano"
SYSTEM_PROMPT = """
Você é o agente de consulta do dataset de bolsistas PQ em Ciência da Computação.
Responda em português, de forma objetiva e útil para um professor analisar bolsas,
áreas de pesquisa, instituições, distribuição regional, diversidade e possíveis
colaborações.

Use a base de arquivos via file_search sempre que a pergunta depender dos dados.
Não invente dados ausentes. Quando houver incerteza, diga que a informação precisa
ser conferida ou que depende das inferências do dataset.
Quando listar pessoas, inclua nome, instituição e, quando útil, nível da bolsa.
Ao citar uma pessoa, sempre prefira scholarship_level, que é o nível real da bolsa.
Use scholarship_category apenas quando o usuário pedir agrupamento agregado como PQ-1 vs PQ-2.
""".strip()

PLANNER_PROMPT = """
Você é o planejador de ferramentas de um agente que responde perguntas sobre um dataset de bolsistas PQ em Ciência da Computação.

Objetivo das ferramentas:
- structured_query: usar quando a pergunta exigir contagem exata, filtros, interseções, rankings, distribuição ou listagem objetiva sobre todos os 480 registros.
- file_search: usar quando a pergunta for aberta, semântica, exploratória ou depender de descrição textual, sem necessidade de contagem exata.

Nunca escreva código. Responda apenas JSON válido.

Campos disponíveis para structured_query:
- name
- institution
- scholarship_level
- lattes_code
- lattes_url
- institution_state_uf
- institution_region
- scholarship_category
- doctorate_year
- years_since_doctorate
- sex_inferred
- main_research_area
- secondary_research_areas
- research_topics
- methods_and_techniques
- application_domains
- career_stage
- academic_rank
- seniority_level
- has_international_experience
- international_countries
- has_industry_experience
- industry_organizations
- has_management_experience
- management_roles
- has_editorial_or_event_experience
- has_patents_or_software_outputs
- publication_or_output_focus
- profile_summary_short
- profile_summary_bullets
- search_keywords
- dashboard_tags
- qa_context
- searchable_text

Operadores disponíveis:
- equals: igualdade normalizada
- contains: contém texto normalizado
- topic: busca ampla de candidatos em searchable_text; a LLM final validará se o candidato realmente pertence ao tema para evitar falsos positivos
- boolean: true/false
- gte: maior ou igual, para números
- lte: menor ou igual, para números

Formato obrigatório para pergunta simples:
{
  "tool": "structured_query" ou "file_search",
  "question": "subpergunta literal que este plano responde",
  "intent": "count" ou "list" ou "distribution" ou "ranking" ou "semantic_answer",
  "reason": "curta justificativa",
  "filters": [
    {"field": "institution", "op": "equals", "value": "USP"}
  ],
  "group_by": null ou "scholarship_level",
  "order_by": null ou "count_desc",
  "limit": 10,
  "answer_hint": "como a resposta final deve explicar o resultado"
}

Formato obrigatório para pergunta composta:
{
  "queries": [
    {
      "tool": "structured_query" ou "file_search",
      "question": "subpergunta 1",
      "intent": "count" ou "list" ou "distribution" ou "ranking" ou "semantic_answer",
      "reason": "curta justificativa",
      "filters": [],
      "group_by": null,
      "order_by": null,
      "limit": 10,
      "answer_hint": "como a resposta final deve explicar o resultado"
    }
  ],
  "reason": "curta justificativa geral"
}

Se a pergunta do usuário tiver várias perguntas separadas por ponto de interrogação, vírgulas ou frases independentes, divida em uma query por subpergunta. Não agrupe temas diferentes em uma única query.

Para perguntas temáticas com contagem ou listagem, prefira structured_query com filtro topic em searchable_text. A LLM final validará semanticamente os candidatos.

Regra de bolsa:
- Para listar pessoas ou exibir bolsa, use scholarship_level.
- Para distribuições detalhadas de bolsa, use scholarship_level.
- Use scholarship_category somente se a pergunta pedir agrupamento agregado, por exemplo PQ-1 vs PQ-2.

Exemplos:
Pergunta: "quantas pessoas da USP são de robótica?"
Resposta:
{"tool":"structured_query","question":"quantas pessoas da USP são de robótica?","intent":"count","reason":"precisa contar interseção exata entre instituição e tópico","filters":[{"field":"institution","op":"equals","value":"USP"},{"field":"searchable_text","op":"topic","value":"robotica"}],"group_by":null,"order_by":null,"limit":10,"answer_hint":"responder a contagem e citar alguns exemplos se houver"}

Pergunta: "quem trabalha com robótica?"
Resposta:
{"tool":"structured_query","question":"quem trabalha com robótica?","intent":"list","reason":"pode buscar candidatos no dataset inteiro e validar semanticamente o tópico","filters":[{"field":"searchable_text","op":"topic","value":"robotica"}],"group_by":null,"order_by":null,"limit":20,"answer_hint":"listar pesquisadores relevantes com instituição e bolsa após validação"}
""".strip()


def get_client() -> OpenAI:
    load_dotenv(dotenv_path=".env")

    return OpenAI(
        timeout=float(os.getenv("OPENAI_TIMEOUT_SECONDS", "120")),
    )


def fallback_chat_title(content: str | None) -> str:
    if not content:
        return "Nova conversa"

    words = re.findall(r"[\wÀ-ÿ]+", content, flags=re.UNICODE)
    title = " ".join(words[:6]).strip()

    return title[:80] or "Nova conversa"


def clean_chat_title(title: str) -> str:
    title = re.sub(r"^[\"'“”‘’]+|[\"'“”‘’]+$", "", title.strip())
    title = re.sub(r"\s+", " ", title)
    title = title.rstrip(".:;,- ")

    return title[:80] or "Nova conversa"


def generate_chat_title(content: str | None) -> str:
    load_dotenv(dotenv_path=".env")
    fallback = fallback_chat_title(content)

    if not content or not os.getenv("OPENAI_API_KEY"):
        return fallback

    try:
        client = get_client()
        model = os.getenv("CHAT_TITLE_MODEL", DEFAULT_TITLE_MODEL)
        response = client.responses.create(
            model=model,
            max_output_tokens=32,
            input=[
                {
                    "role": "system",
                    "content": (
                        "Você gera títulos curtos para conversas de chat em português. "
                        "Responda só o título, sem aspas, sem ponto final, com no máximo 6 palavras."
                    ),
                },
                {
                    "role": "user",
                    "content": content[:1200],
                },
            ],
        )

        return clean_chat_title(response.output_text)
    except Exception:
        return fallback


def history_for_model(session: dict, limit: int = 8) -> list[dict]:
    messages = session.get("messages") or []
    recent = messages[-limit:]

    return [
        {
            "role": message["role"],
            "content": message["content"],
        }
        for message in recent
        if message.get("role") in {"user", "assistant"}
    ]


def response_annotations(response) -> list[dict]:
    annotations = []

    for item in getattr(response, "output", []) or []:
        for content in getattr(item, "content", []) or []:
            for annotation in getattr(content, "annotations", []) or []:
                annotations.append(annotation.model_dump() if hasattr(annotation, "model_dump") else dict(annotation))

    return annotations


def parse_json_object(text: str) -> dict:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, flags=re.DOTALL)

        if not match:
            raise

        return json.loads(match.group(0))


def default_file_search_plan(question: str, reason: str) -> dict:
    return {
        "tool": "file_search",
        "question": question,
        "intent": "semantic_answer",
        "reason": reason,
        "filters": [],
        "group_by": None,
        "order_by": None,
        "limit": 10,
        "answer_hint": "responder usando busca semântica",
    }


def normalize_query_plan(plan: dict, fallback_question: str) -> dict:
    normalized = {
        "tool": plan.get("tool") if plan.get("tool") in {"structured_query", "file_search"} else "file_search",
        "question": plan.get("question") or fallback_question,
        "intent": plan.get("intent") or "semantic_answer",
        "reason": plan.get("reason") or "",
        "filters": plan.get("filters") if isinstance(plan.get("filters"), list) else [],
        "group_by": plan.get("group_by"),
        "order_by": plan.get("order_by"),
        "limit": plan.get("limit") or 10,
        "answer_hint": plan.get("answer_hint") or "",
    }

    return normalized


def normalize_plan_bundle(raw_plan: dict, question: str) -> dict:
    queries = raw_plan.get("queries")

    if isinstance(queries, list) and queries:
        normalized_queries = [
            normalize_query_plan(query, question)
            for query in queries
            if isinstance(query, dict)
        ]
    else:
        normalized_queries = [normalize_query_plan(raw_plan, question)]

    if not normalized_queries:
        normalized_queries = [default_file_search_plan(question, "Planner não retornou queries válidas.")]

    return {
        "queries": normalized_queries,
        "reason": raw_plan.get("reason") or "",
        "raw_plan": raw_plan,
    }


def normalize_text(value: str) -> str:
    value = str(value).replace("_", " ")
    without_accents = "".join(
        char
        for char in unicode_normalize("NFKD", value)
        if not re.match(r"[\u0300-\u036f]", char)
    )

    return re.sub(r"\s+", " ", without_accents.casefold()).strip()


def format_count_items(items: list[dict], limit: int = 12) -> str:
    return ", ".join(
        f"{item.get('label')}: {item.get('count')}"
        for item in items[:limit]
    )


def dashboard_metrics_context() -> str:
    metrics = build_dashboard_metrics()
    dataset = metrics.get("dataset") or {}
    distributions = metrics.get("distributions") or {}
    top_terms = metrics.get("top_terms") or {}
    analysis = metrics.get("analysis") or {}
    recommended = analysis.get("recommended_cards") or {}

    return "\n".join(
        [
            "CONTEXTO AGREGADO DO DATASET, vindo da rota /dashboard/metrics",
            f"Total de perfis: {dataset.get('total_profiles')}",
            f"Perfis com algum campo para revisão: {dataset.get('profiles_with_review_flags')}",
            f"Quantidade de instituições: {recommended.get('institutions_count')}",
            f"Quantidade de UFs: {recommended.get('ufs_count')}",
            f"Quantidade de áreas principais: {recommended.get('main_areas_count')}",
            "",
            "Distribuições principais:",
            f"- Níveis de bolsa brutos: {format_count_items(distributions.get('scholarship_levels') or [])}",
            f"- Categorias de bolsa: {format_count_items(distributions.get('scholarship_categories') or [])}",
            f"- Instituições: {format_count_items(distributions.get('institutions') or [], limit=20)}",
            f"- UFs: {format_count_items(distributions.get('institution_ufs') or [])}",
            f"- Regiões: {format_count_items(distributions.get('institution_regions') or [])}",
            f"- Sexo inferido: {format_count_items(distributions.get('sex') or [])}",
            f"- Áreas principais: {format_count_items(distributions.get('main_research_areas') or [], limit=20)}",
            "",
            "Termos frequentes:",
            f"- Tópicos de pesquisa: {format_count_items(top_terms.get('research_topics') or [], limit=20)}",
            f"- Métodos e técnicas: {format_count_items(top_terms.get('methods_and_techniques') or [], limit=20)}",
            f"- Domínios de aplicação: {format_count_items(top_terms.get('application_domains') or [], limit=20)}",
            "",
            "Guia rápido de campos:",
            "- institution: instituição do bolsista.",
            "- scholarship_level: nível real/bruto da bolsa, como PQ-1A, PQ-1D, PQ-2, PQ-C, PQ-A, PQ-B, PQ-SR. Use por padrão ao citar pessoas.",
            "- scholarship_category: categoria agregada da bolsa, como PQ-1, PQ-2, PQ-C. Use apenas para agrupamentos agregados.",
            "- institution_state_uf: UF da instituição.",
            "- institution_region: região brasileira da instituição.",
            "- sex_inferred: sexo inferido operacionalmente; pode ser unknown.",
            "- main_research_area: área principal inferida.",
            "- research_topics: tópicos de pesquisa inferidos.",
            "- searchable_text: campo virtual usado pelo backend para busca ampla por tema.",
        ]
    )


def full_agent_context() -> str:
    return "\n\n".join(
        [
            dashboard_metrics_context(),
            load_minimal_profiles_context_text(),
        ]
    )


def planner_messages(question: str, session: dict) -> list[dict]:
    recent = history_for_model(session, limit=4)
    dataset_context = full_agent_context()

    return [
        {
            "role": "system",
            "content": f"{PLANNER_PROMPT}\n\n{dataset_context}",
        },
        *recent,
        {
            "role": "user",
            "content": question,
        },
    ]


def plan_question(client: OpenAI, question: str, session: dict) -> dict:
    model = os.getenv("CHAT_PLANNER_MODEL") or os.getenv("CHAT_MODEL") or DEFAULT_PLANNER_MODEL
    response = client.responses.create(
        model=model,
        input=planner_messages(question, session),
    )

    try:
        raw_plan = parse_json_object(response.output_text)
    except Exception:
        raw_plan = default_file_search_plan(
            question,
            "Planner retornou JSON inválido; usando busca semântica.",
        )

    plan_bundle = normalize_plan_bundle(raw_plan, question)
    plan_bundle["_planner_model"] = model
    plan_bundle["_planner_response_id"] = response.id

    return plan_bundle


def is_count_question(question: str) -> bool:
    normalized = normalize_text(question)
    markers = [
        "quantidade",
        "quantos",
        "quantas",
        "total",
        "número",
        "numero",
        "contagem",
        "distribuição",
        "distribuicao",
        "por ",
    ]

    return any(marker in normalized for marker in markers)


def searchable_profile_text(profile: dict) -> str:
    fields = [
        profile.get("name"),
        profile.get("institution"),
        profile.get("summary"),
        semantic_value(profile, "main_research_area"),
        semantic_value(profile, "secondary_research_areas"),
        semantic_value(profile, "research_topics"),
        semantic_value(profile, "methods_and_techniques"),
        semantic_value(profile, "application_domains"),
        semantic_value(profile, "profile_summary_short"),
        semantic_value(profile, "profile_summary_bullets"),
        semantic_value(profile, "search_keywords"),
        semantic_value(profile, "dashboard_tags"),
        semantic_value(profile, "qa_context"),
    ]

    return normalize_text(" ".join(str(field) for field in fields if field))


def detect_institution(question: str, profiles: list[dict]) -> str | None:
    normalized = normalize_text(question)
    institutions = {
        profile.get("institution")
        for profile in profiles
        if profile.get("institution")
    }
    matches = [
        institution
        for institution in institutions
        if normalize_text(institution) in normalized
    ]

    if not matches:
        return None

    return max(matches, key=len)


def detect_topic(question: str) -> str | None:
    normalized = normalize_text(question)
    stopwords = {
        "qual",
        "quais",
        "quantos",
        "quantas",
        "quantidade",
        "total",
        "pessoas",
        "pessoa",
        "bolsistas",
        "pesquisadores",
        "pesquisadoras",
        "alunos",
        "alunas",
        "sao",
        "são",
        "de",
        "da",
        "do",
        "das",
        "dos",
        "na",
        "no",
        "em",
        "com",
        "tem",
        "trabalham",
        "trabalha",
        "atuam",
        "atua",
        "instituicao",
        "instituição",
    }
    institution_like = {"usp", "ufmg", "ufrj", "ufpe", "ufrgs", "unicamp", "unb"}
    words = [
        word
        for word in re.findall(r"[a-z0-9_]+", normalized)
        if word not in stopwords and word not in institution_like and len(word) > 2
    ]

    if not words:
        return None

    return " ".join(words[-3:])


def profile_matches_topic(profile: dict, topic: str) -> bool:
    text = searchable_profile_text(profile)
    normalized_topic = normalize_text(topic)

    if normalized_topic in text:
        return True

    aliases = {
        "robotica": ["robotica", "robotics", "robot", "robots", "drone", "drones"],
        "ia": ["ia", "inteligencia artificial", "artificial intelligence", "machine learning"],
        "inteligencia artificial": ["ia", "inteligencia artificial", "artificial intelligence", "machine learning"],
    }

    for key, values in aliases.items():
        if normalized_topic == key:
            return any(value in text for value in values)

    return False


SEMANTIC_FIELDS = {
    "institution_state_uf",
    "institution_region",
    "scholarship_category",
    "scholarship_level_rank",
    "doctorate_year",
    "years_since_doctorate",
    "profile_language",
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
}


BASE_FIELDS = {
    "name",
    "institution",
    "scholarship_level",
    "lattes_code",
    "lattes_url",
    "photo_url",
    "orcid",
    "summary",
}


def field_value(profile: dict, field: str):
    if field == "searchable_text":
        return searchable_profile_text(profile)

    if field in BASE_FIELDS:
        return profile.get(field)

    if field in SEMANTIC_FIELDS:
        return semantic_value(profile, field)

    return None


def normalize_scalar(value) -> str:
    if isinstance(value, list):
        return normalize_text(" ".join(str(item) for item in value))

    return normalize_text(str(value or ""))


def coerce_bool(value) -> bool | None:
    normalized = normalize_text(str(value))

    if normalized in {"true", "sim", "yes", "1"}:
        return True

    if normalized in {"false", "nao", "não", "no", "0"}:
        return False

    return None


def matches_filter(profile: dict, filter_spec: dict) -> bool:
    field = filter_spec.get("field")
    op = filter_spec.get("op")
    expected = filter_spec.get("value")
    actual = field_value(profile, field)

    if op == "topic":
        return profile_matches_topic(profile, str(expected))

    if op == "equals":
        return normalize_scalar(actual) == normalize_scalar(expected)

    if op == "contains":
        return normalize_scalar(expected) in normalize_scalar(actual)

    if op == "boolean":
        expected_bool = coerce_bool(expected)

        return actual is expected_bool

    if op in {"gte", "lte"}:
        try:
            actual_number = float(actual)
            expected_number = float(expected)
        except (TypeError, ValueError):
            return False

        if op == "gte":
            return actual_number >= expected_number

        return actual_number <= expected_number

    return False


def compact_profile(profile: dict) -> dict:
    return {
        "name": profile.get("name"),
        "institution": profile.get("institution"),
        "scholarship_level": profile.get("scholarship_level"),
        "lattes_url": profile.get("lattes_url"),
        "institution_state_uf": semantic_value(profile, "institution_state_uf"),
        "institution_region": semantic_value(profile, "institution_region"),
        "scholarship_category": semantic_value(profile, "scholarship_category"),
        "sex_inferred": semantic_value(profile, "sex_inferred"),
        "main_research_area": semantic_value(profile, "main_research_area"),
        "secondary_research_areas": semantic_value(profile, "secondary_research_areas"),
        "research_topics": semantic_value(profile, "research_topics"),
        "methods_and_techniques": semantic_value(profile, "methods_and_techniques"),
        "application_domains": semantic_value(profile, "application_domains"),
        "profile_summary_short": semantic_value(profile, "profile_summary_short"),
        "profile_summary_bullets": semantic_value(profile, "profile_summary_bullets"),
        "search_keywords": semantic_value(profile, "search_keywords"),
        "dashboard_tags": semantic_value(profile, "dashboard_tags"),
        "qa_context": semantic_value(profile, "qa_context"),
    }


def execute_structured_plan(plan: dict) -> dict:
    _current, profiles = load_active_profiles()
    filters = plan.get("filters") or []
    filtered = profiles
    topic_filters = [
        filter_spec
        for filter_spec in filters
        if filter_spec.get("op") == "topic"
    ]

    for filter_spec in filters:
        filtered = [
            profile
            for profile in filtered
            if matches_filter(profile, filter_spec)
        ]

    group_by = plan.get("group_by")
    limit = int(plan.get("limit") or 10)
    limit = max(1, min(limit, 50))
    validation_limit = int(os.getenv("CHAT_TOPIC_VALIDATION_LIMIT", "120"))
    validation_limit = max(10, min(validation_limit, 200))
    result = {
        "tool": "structured_query",
        "intent": plan.get("intent"),
        "total_profiles": len(profiles),
        "matched_count": len(filtered),
        "matched_count_is_broad_candidate_count": bool(topic_filters),
        "validation_required": bool(topic_filters),
        "validation_reason": (
            "Há filtro de tópico em texto livre. Os candidatos precisam ser validados pela LLM final para evitar falsos positivos."
            if topic_filters
            else None
        ),
        "topic_filters": topic_filters,
        "filters": filters,
        "group_by": group_by,
        "examples": [compact_profile(profile) for profile in filtered[:limit]],
    }

    if topic_filters:
        result["candidates_for_validation"] = [
            compact_profile(profile)
            for profile in filtered[:validation_limit]
        ]
        result["candidates_for_validation_count"] = min(len(filtered), validation_limit)
        result["candidates_truncated"] = len(filtered) > validation_limit

    if group_by:
        counts = Counter(str(field_value(profile, group_by) or "unknown") for profile in filtered)
        result["groups"] = [
            {
                "label": label,
                "count": count,
            }
            for label, count in counts.most_common(limit)
        ]

    if plan.get("intent") == "ranking" and not group_by:
        counts = Counter(profile.get("institution") or "unknown" for profile in filtered)
        result["ranking"] = [
            {
                "label": label,
                "count": count,
            }
            for label, count in counts.most_common(limit)
        ]

    return result


def structured_count_answer(question: str) -> str | None:
    if not is_count_question(question):
        return None

    _current, profiles = load_active_profiles()
    normalized = normalize_text(question)
    institution = detect_institution(question, profiles)
    topic = detect_topic(question)
    filtered = profiles

    if institution:
        filtered = [
            profile
            for profile in filtered
            if profile.get("institution") == institution
        ]

    if topic:
        topic_filtered = [
            profile
            for profile in filtered
            if profile_matches_topic(profile, topic)
        ]

        if topic_filtered:
            filtered = topic_filtered

    group_fields = {
        "regiao": "institution_region",
        "uf": "institution_state_uf",
        "sexo": "sex_inferred",
        "genero": "sex_inferred",
        "bolsa": "scholarship_level",
        "nivel": "scholarship_level",
        "categoria": "scholarship_category",
        "area": "main_research_area",
    }

    for marker, field_id in group_fields.items():
        if marker in normalized:
            counts = Counter(semantic_value(profile, field_id, "unknown") for profile in profiles)
            items = ", ".join(f"{label}: {count}" for label, count in counts.most_common(10))

            return f"Distribuição por {marker}: {items}."

    if institution and topic:
        names = ", ".join(
            f"{profile.get('name')} ({profile.get('scholarship_level')})"
            for profile in filtered[:8]
        )
        suffix = f" Exemplos: {names}." if names else ""

        return (
            f"Encontrei {len(filtered)} pessoa(s) da instituição {institution} "
            f"relacionada(s) a {topic}.{suffix}"
        )

    if institution:
        return f"O dataset ativo tem {len(filtered)} pessoa(s) vinculada(s) à instituição {institution}."

    if "institui" in normalized:
        institutions = Counter(profile.get("institution") or "unknown" for profile in profiles)
        total_institutions = len([item for item in institutions if item != "unknown"])

        return f"O dataset ativo tem {total_institutions} instituições diferentes representadas."

    if any(term in normalized for term in ["total", "bolsistas", "pessoas", "pesquisadores"]):
        return f"O dataset ativo tem {len(profiles)} bolsistas."

    return None


def ask_chat(session_id: str, question: str, max_num_results: int = 8) -> dict:
    load_dotenv(dotenv_path=".env")
    vector_store_id = require_vector_store_id()
    session = get_session(session_id)
    model = os.getenv("CHAT_MODEL", DEFAULT_CHAT_MODEL)
    client = get_client()
    dataset_context = full_agent_context()

    append_message(session_id, "user", question)
    session = get_session(session_id)
    plan_bundle = plan_question(client, question, session)
    query_plans = plan_bundle.get("queries") or []
    tool_results = []
    file_search_plans = []
    response = None

    structured_enabled = os.getenv("CHAT_DISABLE_STRUCTURED_QUERY") != "1"

    for index, query_plan in enumerate(query_plans, start=1):
        if query_plan.get("tool") == "structured_query" and structured_enabled:
            tool_results.append(
                {
                    "index": index,
                    "question": query_plan.get("question") or question,
                    "plan": query_plan,
                    "result": execute_structured_plan(query_plan),
                }
            )
        else:
            file_search_plans.append(
                {
                    "index": index,
                    "question": query_plan.get("question") or question,
                    "plan": query_plan,
                }
            )

    if tool_results and not file_search_plans:
        final_messages = [
            {
                "role": "system",
                "content": (
                    f"{SYSTEM_PROMPT}\n\n"
                    f"{dataset_context}\n\n"
                    "Você é o agente validador e redator final.\n\n"
                    "Você recebeu abaixo resultados de ferramentas estruturadas executadas no backend. "
                    "Use esses dados como fonte principal. Não invente números fora do resultado.\n\n"
                    "Se validation_required=true, o matched_count é apenas uma contagem ampla de candidatos, "
                    "não uma contagem final validada. Nesse caso, revise cada item em candidates_for_validation "
                    "e conte apenas os perfis que realmente satisfazem o tema pedido. "
                    "Por padrão, tema significa atuação, área de pesquisa, tópicos, métodos ou domínio de aplicação atuais. "
                    "Não conte apenas formação acadêmica, departamento, título de grau, menção histórica, nome de evento, "
                    "nome de sistema ou uso incidental do termo, a menos que a pergunta peça explicitamente formação. "
                    "Descarte falsos positivos em que o termo aparece de forma incidental, indireta ou em outro sentido, "
                    "como, por exemplo, 'votação eletrônica' quando a pergunta for sobre atuação em eletrônica. "
                    "Explique em uma frase qual critério você usou para validar. "
                    "Se houver candidatos_truncated=true, diga que a validação foi feita sobre a amostra enviada e que a contagem ampla pode precisar de revisão.\n\n"
                    "Se validation_required=false, você pode tratar matched_count, groups e ranking como resultados determinísticos. "
                    "Se houver exemplos, use no máximo os mais relevantes.\n\n"
                    "Ao citar pessoas, sempre mostre scholarship_level como nível da bolsa. "
                    "Não substitua scholarship_level por scholarship_category. "
                    "Use scholarship_category apenas quando o usuário pedir uma análise agregada por categoria.\n\n"
                    "Quando a pergunta original tiver várias subperguntas, responda todas na mesma ordem. "
                    "Não diga que não recebeu consulta específica se existir um resultado de ferramenta para aquela subpergunta. "
                    "Não encerre oferecendo refazer a busca; entregue a melhor resposta possível."
                ),
            },
            *history_for_model(session),
            {
                "role": "user",
                "content": (
                    f"Pergunta original: {question}\n\n"
                    f"Plano da primeira LLM:\n{json.dumps(plan_bundle, ensure_ascii=False, indent=2)}\n\n"
                    f"Resultados das ferramentas estruturadas:\n{json.dumps(tool_results, ensure_ascii=False, indent=2)}"
                ),
            },
        ]
        response = client.responses.create(
            model=model,
            input=final_messages,
        )
    else:
        final_messages = [
            {
                "role": "system",
                "content": (
                    f"{SYSTEM_PROMPT}\n\n"
                    f"{dataset_context}\n\n"
                    "Você é o agente redator final. A primeira LLM pode ter separado a pergunta em subconsultas.\n\n"
                    "Quando houver resultados estruturados abaixo, use-os como fonte principal para essas subperguntas. "
                    "Para as subperguntas marcadas como file_search, use a busca nos arquivos. "
                    "Se a pergunta pedir contagem exata e só houver File Search para ela, avise que busca semântica não garante contagem exata. "
                    "Ao citar pessoas, sempre mostre scholarship_level como nível da bolsa. "
                    "Não substitua scholarship_level por scholarship_category. "
                    "Use scholarship_category apenas quando o usuário pedir uma análise agregada por categoria. "
                    "Quando a pergunta original tiver várias subperguntas, responda todas na mesma ordem."
                ),
            },
            *history_for_model(session),
            {
                "role": "user",
                "content": (
                    f"Pergunta original: {question}\n\n"
                    f"Plano da primeira LLM:\n{json.dumps(plan_bundle, ensure_ascii=False, indent=2)}\n\n"
                    f"Resultados estruturados já executados:\n{json.dumps(tool_results, ensure_ascii=False, indent=2)}\n\n"
                    f"Subperguntas que ainda dependem de File Search:\n{json.dumps(file_search_plans, ensure_ascii=False, indent=2)}"
                ),
            },
        ]
        response = client.responses.create(
            model=model,
            input=final_messages,
            tools=[
                {
                    "type": "file_search",
                    "vector_store_ids": [vector_store_id],
                    "max_num_results": max_num_results,
                }
            ],
        )

    answer = response.output_text
    tool_result = tool_results[0]["result"] if tool_results else None
    context_mode = "structured_query"

    if tool_results and file_search_plans:
        context_mode = "hybrid"
    elif file_search_plans:
        context_mode = "file_search"

    metadata = {
        "model": model,
        "planner_model": plan_bundle.get("_planner_model"),
        "planner_response_id": plan_bundle.get("_planner_response_id"),
        "plan": plan_bundle,
        "tool_result": tool_result,
        "tool_results": tool_results,
        "file_search_plans": file_search_plans,
        "context_mode": context_mode,
        "vector_store_id": vector_store_id,
        "max_num_results": 0 if context_mode == "structured_query" else max_num_results,
        "response_id": response.id,
        "annotations": response_annotations(response),
    }
    assistant_message = append_message(session_id, "assistant", answer, metadata)

    return {
        "session_id": session_id,
        "answer": answer,
        "message": assistant_message,
        "metadata": metadata,
    }
