import asyncio
import csv
import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path
from shutil import which
from urllib.parse import urljoin

from bs4 import BeautifulSoup
from dotenv import load_dotenv
from playwright.async_api import async_playwright


load_dotenv()

LATTES_SEARCH_URL = "https://buscatextual.cnpq.br/buscatextual/busca.do?metodo=apresentar"
LATTES_BASE_URL = "https://buscatextual.cnpq.br/buscatextual/"
LATTES_RECAPTCHA_SITE_KEY = "6Le8-aQUAAAAAEh7lq-D8bscahYZDZ4RKXBEhiov"
PREVIEW_RESULTS_DIR = Path("scrape_results") / "lattes_preview"
FULL_RESULTS_DIR = Path("scrape_results") / "lattes_full"
DETAIL_PATTERN = re.compile(
    r"abreDetalhe\('(?P<code>[^']+)','(?P<slug>[^']+)',(?P<person_id>\d+),?"
)
DATE_PATTERN = re.compile(r"Certificado pelo autor em\s*(\d{2}/\d{2}/\d{4})")
TOTAL_RESULTS_PATTERN = re.compile(r"var\s+intLTotReg\s*=\s*(\d+)")
PAGE_SIZE_PATTERN = re.compile(r"var\s+intLRegPagina\s*=\s*(\d+)")
MAX_SEARCH_RESULT_PAGES = 20
MAX_PREVIEW_CANDIDATES = 100
LLM_CONFIDENCE_THRESHOLD = 0.85
LLM_SUMMARY_MAX_CHARS = 1200
PROFILE_FIELDS = [
    "name",
    "institution",
    "scholarship_level",
    "match_status",
    "candidates_count",
    "review_reason",
    "lattes_code",
    "lattes_name",
    "lattes_preview_url",
    "certified_at",
    "orcid",
    "external_links",
    "summary",
    "llm_review_status",
    "llm_review_confidence",
    "llm_review_reason",
    "error",
]
FULL_PROFILE_FIELDS = [
    "name",
    "institution",
    "scholarship_level",
    "match_status",
    "lattes_code",
    "lattes_name",
    "public_lattes_id",
    "lattes_url",
    "photo_url",
    "last_updated",
    "orcid",
    "summary",
    "full_cv_text_length",
    "looks_like_full_cv",
    "blocked_or_invalid",
    "sections_count",
    "detail_json_path",
    "raw_html_path",
    "raw_text_path",
    "error",
]
TECHNICAL_ERROR_RETRIES = 5


def create_run_dir(results_dir: Path) -> Path:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    run_dir = results_dir / timestamp
    run_dir.mkdir(parents=True, exist_ok=True)

    return run_dir


async def debug_search_form() -> None:
    chromium_path = which("chromium") or which("chromium-browser")
    run_dir = create_run_dir(PREVIEW_RESULTS_DIR)

    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(
            executable_path=chromium_path,
            headless=True,
        )

        try:
            page = await browser.new_page()
            await page.goto(
                LATTES_SEARCH_URL,
                wait_until="domcontentloaded",
                timeout=30_000,
            )

            html = await page.content()
            soup = BeautifulSoup(html, "html.parser")
            controls = []

            for element in soup.select("input, select, button"):
                controls.append(
                    {
                        "tag": element.name,
                        "id": element.get("id"),
                        "name": element.get("name"),
                        "type": element.get("type"),
                        "value": element.get("value"),
                        "text": element.get_text(" ", strip=True),
                    }
                )

            (run_dir / "search_form.html").write_text(html, encoding="utf-8")
            (run_dir / "search_form_controls.json").write_text(
                json.dumps(controls, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )

            print(f"Results: {run_dir}")
            print(f"Controls found: {len(controls)}")
        finally:
            await browser.close()


def extract_result_candidates(html: str) -> list[dict]:
    soup = BeautifulSoup(html, "html.parser")
    candidates = []

    for link in soup.find_all("a"):
        href = link.get("href") or ""
        text = link.get_text(" ", strip=True)

        if "visualizacv.do" not in href and "javascript:abreDetalhe" not in href:
            continue

        detail_match = DETAIL_PATTERN.search(href)

        candidate = {
            "text": text,
            "href": href,
        }

        if detail_match:
            candidate.update(detail_match.groupdict())

        candidates.append(candidate)

    return candidates


def extract_pagination_starts(html: str) -> list[tuple[int, int]]:
    total_match = TOTAL_RESULTS_PATTERN.search(html)
    page_size_match = PAGE_SIZE_PATTERN.search(html)

    if not total_match or not page_size_match:
        return []

    total = int(total_match.group(1))
    page_size = int(page_size_match.group(1))

    if total <= page_size:
        return []

    starts = [
        (start, page_size)
        for start in range(page_size, total, page_size)
    ]

    return starts[: MAX_SEARCH_RESULT_PAGES - 1]


def deduplicate_candidates(candidates: list[dict]) -> list[dict]:
    deduplicated = []
    seen = set()

    for candidate in candidates:
        key = (
            candidate.get("code"),
            candidate.get("person_id"),
            candidate.get("href"),
        )

        if key in seen:
            continue

        seen.add(key)
        deduplicated.append(candidate)

    return deduplicated


def clean_text(value: str) -> str:
    return " ".join(value.split())


def normalize(value: str | None) -> str:
    return clean_text(value or "").casefold()


def looks_like_full_cv_text(text: str) -> bool:
    return (
        "Dados gerais" in text
        or "Formação acadêmica" in text
        or "Produções" in text
    )


def is_full_cv_blocked_or_invalid(text: str) -> bool:
    normalized = normalize(text)
    blocked_phrases = [
        "não foi possível acessar",
        "nao foi possivel acessar",
        "não foi possível recuperar",
        "nao foi possivel recuperar",
        "currículo não encontrado",
        "curriculo nao encontrado",
        "preencha o captcha",
        "resolver o captcha",
        "verificação captcha",
    ]

    return any(phrase in normalized for phrase in blocked_phrases)


def sanitize_filename(value: str) -> str:
    normalized = re.sub(r"[^a-zA-Z0-9_-]+", "_", value.strip())
    return normalized.strip("_")[:120] or "unknown"


def parse_json_cell(value: str | None, fallback):
    if not value:
        return fallback

    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return fallback


def profile_key(row: dict) -> tuple[str, str]:
    return (
        normalize(row.get("name")),
        normalize(row.get("institution")),
    )


def extract_profile_from_preview(html: str, candidate: dict) -> dict:
    soup = BeautifulSoup(html, "html.parser")
    page_text = soup.get_text(" ", strip=True)
    name = soup.select_one("h1.name")
    summary = soup.select_one("p.resumo")
    certified_match = DATE_PATTERN.search(page_text)
    external_links = []

    for link in soup.select(".linksInstituicoes a"):
        label = clean_text(link.get_text(" ", strip=True))
        onclick = link.get("onclick") or ""
        url_match = re.search(r"abrirLink\('([^']+)'\)", onclick)

        if url_match:
            external_links.append(
                {
                    "label": label,
                    "url": url_match.group(1),
                }
            )

    orcid = next(
        (
            link["url"]
            for link in external_links
            if "orcid.org" in link["url"]
        ),
        None,
    )

    return {
        "name": clean_text(name.get_text(" ", strip=True)) if name else candidate["text"],
        "lattes_code": candidate.get("code"),
        "lattes_preview_url": urljoin(
            LATTES_BASE_URL,
            f"preview.do?metodo=apresentar&id={candidate.get('code')}",
        ),
        "summary": clean_text(summary.get_text(" ", strip=True)) if summary else None,
        "certified_at": certified_match.group(1) if certified_match else None,
        "orcid": orcid,
        "external_links": external_links,
    }


def extract_full_cv_profile(html: str, base_profile: dict) -> dict:
    soup = BeautifulSoup(html, "html.parser")
    text = soup.get_text(" ", strip=True)
    title_name = soup.select_one("h2.nome")
    summary = soup.select_one("p.resumo")
    photo = soup.select_one("img.foto")
    info_items = [
        clean_text(item.get_text(" ", strip=True))
        for item in soup.select(".informacoes-autor li")
    ]
    full_profile = {
        "name": base_profile.get("name") or (
            clean_text(title_name.get_text(" ", strip=True)) if title_name else None
        ),
        "institution": base_profile.get("institution"),
        "scholarship_level": base_profile.get("scholarship_level"),
        "match_status": "matched",
        "lattes_code": base_profile.get("lattes_code"),
        "lattes_name": base_profile.get("lattes_name"),
        "public_lattes_id": None,
        "lattes_url": None,
        "photo_url": urljoin(LATTES_BASE_URL, photo.get("src")) if photo and photo.get("src") else None,
        "last_updated": None,
        "orcid": base_profile.get("orcid"),
        "summary": clean_text(summary.get_text(" ", strip=True)) if summary else base_profile.get("summary"),
        "full_cv_text_length": len(text),
        "looks_like_full_cv": looks_like_full_cv_text(text),
        "blocked_or_invalid": is_full_cv_blocked_or_invalid(text),
        "error": None,
        "sections_text": {},
    }

    for item in info_items:
        if "Endereço para acessar este CV:" in item:
            full_profile["lattes_url"] = item.split(":", 1)[1].strip()
        elif "ID Lattes:" in item:
            full_profile["public_lattes_id"] = item.split(":", 1)[1].strip()
        elif "Última atualização do currículo em" in item:
            full_profile["last_updated"] = item.replace(
                "Última atualização do currículo em",
                "",
            ).strip()

    orcid_link = soup.select_one('a[href*="orcid.org"]')

    if orcid_link:
        full_profile["orcid"] = orcid_link.get("href")

    section_names = [
        "Identificacao",
        "Endereco",
        "FormacaoAcademicaTitulacao",
        "FormacaoAcademicaPosDoutorado",
        "AtuacaoProfissional",
        "AreasAtuacao",
        "ProjetosPesquisa",
        "ProducaoBibliografica",
        "ProducaoTecnica",
        "PatentesRegistros",
        "Eventos",
        "Orientacoes",
        "Bancas",
        "Citacoes",
    ]

    for section_name in section_names:
        anchor = soup.find("a", attrs={"name": section_name})

        if not anchor:
            continue

        wrapper = anchor.find_parent("div", class_="title-wrapper")

        if wrapper:
            full_profile["sections_text"][section_name] = clean_text(
                wrapper.get_text(" ", strip=True)
            )

    return full_profile


def build_full_profile_detail(result: dict, artifacts: dict) -> dict:
    return {
        "identity": {
            "name": result.get("name"),
            "lattes_name": result.get("lattes_name"),
            "institution": result.get("institution"),
            "scholarship_level": result.get("scholarship_level"),
            "lattes_code": result.get("lattes_code"),
            "public_lattes_id": result.get("public_lattes_id"),
            "lattes_url": result.get("lattes_url"),
            "photo_url": result.get("photo_url"),
            "orcid": result.get("orcid"),
            "last_updated": result.get("last_updated"),
        },
        "status": {
            "match_status": result.get("match_status"),
            "looks_like_full_cv": result.get("looks_like_full_cv"),
            "blocked_or_invalid": result.get("blocked_or_invalid"),
            "error": result.get("error"),
        },
        "summary": result.get("summary"),
        "sections_text": result.get("sections_text", {}),
        "artifacts": artifacts,
    }


def make_full_csv_row(result: dict) -> dict:
    row = {field: result.get(field) for field in FULL_PROFILE_FIELDS}
    row["sections_count"] = len(result.get("sections_text") or {})

    return row


def make_full_json_row(result: dict) -> dict:
    return {
        **make_full_csv_row(result),
        "sections_available": sorted((result.get("sections_text") or {}).keys()),
    }


def profile_mentions_institution(profile: dict, institution: str) -> bool:
    institution = normalize(institution)

    if not institution:
        return False

    searchable_parts = [
        profile.get("summary"),
        " ".join(link["label"] for link in profile.get("external_links", [])),
        " ".join(link["url"] for link in profile.get("external_links", [])),
    ]

    return institution in normalize(" ".join(searchable_parts))


def compact_candidate_for_llm(candidate: dict) -> dict:
    external_links = candidate.get("external_links") or []

    return {
        "lattes_code": candidate.get("lattes_code"),
        "name": candidate.get("name"),
        "certified_at": candidate.get("certified_at"),
        "summary": (candidate.get("summary") or "")[:LLM_SUMMARY_MAX_CHARS],
        "external_links": external_links[:10],
    }


def build_llm_review_prompt(result: dict) -> str:
    payload = {
        "target": {
            "name": result.get("name"),
            "institution": result.get("institution"),
            "scholarship_level": result.get("scholarship_level"),
        },
        "candidates": [
            compact_candidate_for_llm(candidate)
            for candidate in result.get("candidates", [])
        ],
    }

    return (
        "Você resolve ambiguidade de perfis Lattes para uma base acadêmica.\n"
        "Escolha um candidato somente se houver evidência forte de que ele é a pessoa alvo.\n"
        "Use principalmente nome, instituição, links externos e resumo do perfil.\n"
        "O nível de bolsa vindo da base CNPq é contexto auxiliar, não uma exigência.\n"
        "Não trate ausência de menção à bolsa no preview do Lattes como falta de evidência.\n"
        "Se nome, instituição esperada e área acadêmica forem fortemente compatíveis, isso pode ser suficiente para matched.\n"
        "Dê peso negativo a candidatos de outra área ou instituição, mesmo quando o nome for igual.\n"
        "Se houver dúvida real, responda ambiguous.\n"
        "Não invente dados e não escolha código fora da lista de candidatos.\n\n"
        "Responda apenas JSON válido neste formato:\n"
        "{"
        "\"status\":\"matched|ambiguous\","
        "\"lattes_code\":\"codigo ou null\","
        "\"confidence\":0.0,"
        "\"reason\":\"explicação curta\""
        "}\n\n"
        f"Dados:\n{json.dumps(payload, ensure_ascii=False, indent=2)}"
    )


def parse_llm_json_response(content: str) -> dict:
    content = content.strip()

    if content.startswith("```"):
        content = re.sub(r"^```(?:json)?\s*", "", content)
        content = re.sub(r"\s*```$", "", content)

    return json.loads(content)


def apply_llm_decision(result: dict, decision: dict) -> dict:
    allowed_codes = {
        candidate.get("lattes_code"): candidate
        for candidate in result.get("candidates", [])
        if candidate.get("lattes_code")
    }
    selected_code = decision.get("lattes_code")
    confidence = float(decision.get("confidence") or 0)
    reason = decision.get("reason") or "LLM não informou justificativa"

    result["llm_review_status"] = decision.get("status")
    result["llm_review_confidence"] = confidence
    result["llm_review_reason"] = reason

    if (
        decision.get("status") != "matched"
        or confidence < LLM_CONFIDENCE_THRESHOLD
        or selected_code not in allowed_codes
    ):
        return result

    matched_profile = allowed_codes[selected_code]
    result.update(
        {
            "match_status": "matched",
            "review_reason": f"LLM escolheu candidato: {reason}",
            "lattes_code": matched_profile.get("lattes_code"),
            "lattes_name": matched_profile.get("name"),
            "lattes_preview_url": matched_profile.get("lattes_preview_url"),
            "certified_at": matched_profile.get("certified_at"),
            "orcid": matched_profile.get("orcid"),
            "external_links": matched_profile.get("external_links", []),
            "summary": matched_profile.get("summary"),
        }
    )

    return result


def review_ambiguous_with_llm(results: list[dict], run_dir: Path) -> list[dict]:
    api_key = os.getenv("OPENAI_API_KEY")
    decisions = []

    if os.getenv("LATTES_DISABLE_LLM") == "1":
        (run_dir / "llm_review.json").write_text(
            json.dumps(
                {
                    "enabled": False,
                    "reason": "LATTES_DISABLE_LLM=1",
                    "decisions": decisions,
                },
                ensure_ascii=False,
                indent=2,
            ),
            encoding="utf-8",
        )
        return decisions

    if not api_key:
        (run_dir / "llm_review.json").write_text(
            json.dumps(
                {
                    "enabled": False,
                    "reason": "OPENAI_API_KEY não configurada",
                    "decisions": decisions,
                },
                ensure_ascii=False,
                indent=2,
            ),
            encoding="utf-8",
        )
        return decisions

    try:
        from openai import OpenAI
    except ImportError as error:
        (run_dir / "llm_review.json").write_text(
            json.dumps(
                {
                    "enabled": False,
                    "reason": f"OpenAI SDK indisponível: {error}",
                    "decisions": decisions,
                },
                ensure_ascii=False,
                indent=2,
            ),
            encoding="utf-8",
        )
        return decisions

    client = OpenAI(api_key=api_key)
    model = os.getenv("LATTES_LLM_MODEL", "gpt-5.4-mini")

    for result in results:
        if result.get("match_status") != "ambiguous":
            continue

        try:
            response = client.responses.create(
                model=model,
                input=build_llm_review_prompt(result),
            )
            decision = parse_llm_json_response(response.output_text)
            previous_status = result.get("match_status")
            apply_llm_decision(result, decision)
            decisions.append(
                {
                    "name": result.get("name"),
                    "institution": result.get("institution"),
                    "previous_status": previous_status,
                    "final_status": result.get("match_status"),
                    "decision": decision,
                }
            )
        except Exception as error:
            result["llm_review_status"] = "error"
            result["llm_review_confidence"] = 0
            result["llm_review_reason"] = str(error)
            decisions.append(
                {
                    "name": result.get("name"),
                    "institution": result.get("institution"),
                    "previous_status": result.get("match_status"),
                    "final_status": result.get("match_status"),
                    "error": str(error),
                }
            )

    (run_dir / "llm_review.json").write_text(
        json.dumps(
            {
                "enabled": True,
                "model": model,
                "confidence_threshold": LLM_CONFIDENCE_THRESHOLD,
                "decisions": decisions,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    return decisions


def choose_match(profiles: list[dict], name: str, institution: str) -> tuple[str, str, dict | None]:
    exact_name_profiles = [
        profile for profile in profiles if normalize(profile.get("name")) == normalize(name)
    ]

    if not profiles:
        return "not_found", "Nenhum candidato encontrado no Lattes", None

    if len(exact_name_profiles) == 1 and len(profiles) == 1:
        return "matched", "Único candidato com nome igual", exact_name_profiles[0]

    institution_matches = [
        profile
        for profile in exact_name_profiles or profiles
        if profile_mentions_institution(profile, institution)
    ]

    if len(institution_matches) == 1:
        return "matched", "Candidato escolhido por menção à instituição", institution_matches[0]

    if len(profiles) == 1 and exact_name_profiles:
        return "matched", "Único candidato com nome igual", profiles[0]

    return "ambiguous", "Mais de um candidato possível", None


async def submit_search(page, name: str) -> None:
    await page.goto(
        LATTES_SEARCH_URL,
        wait_until="domcontentloaded",
        timeout=30_000,
    )
    await page.fill("#textoBusca", name)
    await page.wait_for_function(
        "() => window.grecaptcha && window.grecaptcha.execute",
        timeout=30_000,
    )

    async with page.expect_navigation(
        wait_until="domcontentloaded",
        timeout=30_000,
    ):
        await page.evaluate("buscar()")


async def collect_search_result_pages(page, first_html: str) -> tuple[list[dict], list[dict]]:
    pages = [
        {
            "page": 1,
            "start": 0,
            "page_size": None,
            "html": first_html,
            "candidates": extract_result_candidates(first_html),
        }
    ]
    pagination_starts = extract_pagination_starts(first_html)

    for page_number, (start, page_size) in enumerate(pagination_starts, start=2):
        async with page.expect_navigation(
            wait_until="domcontentloaded",
            timeout=30_000,
        ):
            await page.evaluate(
                "([inicio, qtd]) => submeterPaginacao(inicio, qtd)",
                [start, page_size],
            )

        html = await page.content()
        pages.append(
            {
                "page": page_number,
                "start": start,
                "page_size": page_size,
                "html": html,
                "candidates": extract_result_candidates(html),
            }
        )

    candidates = deduplicate_candidates(
        candidate
        for result_page in pages
        for candidate in result_page["candidates"]
    )

    return candidates, pages


async def fetch_preview_profile(page, candidate: dict) -> tuple[dict | None, str | None, str | None]:
    if not candidate.get("code"):
        return None, None, None

    preview_url = urljoin(
        LATTES_BASE_URL,
        f"preview.do?metodo=apresentar&id={candidate['code']}",
    )
    await page.goto(preview_url, wait_until="domcontentloaded", timeout=30_000)
    preview_html = await page.content()
    preview_text = BeautifulSoup(preview_html, "html.parser").get_text(" ", strip=True)
    profile = extract_profile_from_preview(preview_html, candidate)

    return profile, preview_html, preview_text


async def fetch_full_cv(page, lattes_code: str) -> tuple[str, str, str]:
    preview_url = urljoin(
        LATTES_BASE_URL,
        f"preview.do?metodo=apresentar&id={lattes_code}",
    )
    await page.goto(preview_url, wait_until="domcontentloaded", timeout=30_000)
    await page.wait_for_function(
        "() => window.grecaptcha && window.grecaptcha.execute",
        timeout=30_000,
    )
    token = await page.evaluate(
        """
        (siteKey) => new Promise((resolve, reject) => {
            grecaptcha.ready(() => {
                grecaptcha
                    .execute(siteKey, { action: "id_form_previw" })
                    .then(resolve)
                    .catch(reject);
            });
        })
        """,
        LATTES_RECAPTCHA_SITE_KEY,
    )
    full_cv_url = urljoin(
        LATTES_BASE_URL,
        f"visualizacv.do?id={lattes_code}&tokenCaptchar={token}",
    )

    await page.goto(full_cv_url, wait_until="domcontentloaded", timeout=30_000)

    html = await page.content()
    text = BeautifulSoup(html, "html.parser").get_text(" ", strip=True)

    return full_cv_url, html, text


async def enrich_person(page, scholarship: dict, raw_dir: Path | None = None) -> dict:
    name = scholarship["name"]
    institution = scholarship.get("institution", "")

    search_html = ""
    search_text = ""
    candidates = []
    search_pages = []

    for attempt in range(1, 4):
        await submit_search(page, name)

        search_html = await page.content()
        search_text = BeautifulSoup(search_html, "html.parser").get_text(" ", strip=True)
        candidates, search_pages = await collect_search_result_pages(page, search_html)

        if candidates or "Stale file handle" not in search_text:
            break

        if attempt < 3:
            await asyncio.sleep(1)

    if not candidates and "Stale file handle" in search_text:
        raise RuntimeError("Lattes retornou 'Stale file handle' sem candidatos")

    profiles = []

    if raw_dir:
        person_dir = raw_dir / sanitize_filename(name)
        person_dir.mkdir(parents=True, exist_ok=True)
        (person_dir / "search_result.html").write_text(search_html, encoding="utf-8")
        (person_dir / "search_result.txt").write_text(search_text, encoding="utf-8")
        (person_dir / "candidates.json").write_text(
            json.dumps(candidates, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        (person_dir / "search_pages.json").write_text(
            json.dumps(
                [
                    {
                        "page": result_page["page"],
                        "start": result_page["start"],
                        "page_size": result_page["page_size"],
                        "candidates_count": len(result_page["candidates"]),
                    }
                    for result_page in search_pages
                ],
                ensure_ascii=False,
                indent=2,
            ),
            encoding="utf-8",
        )

        for result_page in search_pages[1:]:
            (person_dir / f"search_result_page_{result_page['page']}.html").write_text(
                result_page["html"],
                encoding="utf-8",
            )

    for candidate in candidates[:MAX_PREVIEW_CANDIDATES]:
        profile, preview_html, preview_text = await fetch_preview_profile(page, candidate)

        if not profile:
            continue

        profiles.append(profile)

        if raw_dir:
            person_dir = raw_dir / sanitize_filename(name)
            file_stem = sanitize_filename(profile["lattes_code"] or profile["name"])
            (person_dir / f"{file_stem}_preview.html").write_text(
                preview_html or "",
                encoding="utf-8",
            )
            (person_dir / f"{file_stem}_preview.txt").write_text(
                preview_text or "",
                encoding="utf-8",
            )

    match_status, review_reason, matched_profile = choose_match(
        profiles,
        name,
        institution,
    )

    result = {
        "name": name,
        "institution": institution,
        "scholarship_level": scholarship.get("scholarship_level", ""),
        "match_status": match_status,
        "review_reason": review_reason,
        "candidates_count": len(candidates),
        "lattes_code": None,
        "lattes_name": None,
        "lattes_preview_url": None,
        "certified_at": None,
        "orcid": None,
        "external_links": [],
        "summary": None,
        "llm_review_status": None,
        "llm_review_confidence": None,
        "llm_review_reason": None,
        "error": None,
        "scholarship": scholarship,
        "candidates": profiles,
    }

    if matched_profile:
        result.update(
            {
                "lattes_code": matched_profile.get("lattes_code"),
                "lattes_name": matched_profile.get("name"),
                "lattes_preview_url": matched_profile.get("lattes_preview_url"),
                "certified_at": matched_profile.get("certified_at"),
                "orcid": matched_profile.get("orcid"),
                "external_links": matched_profile.get("external_links", []),
                "summary": matched_profile.get("summary"),
            }
        )

    return result


def to_csv_row(result: dict) -> dict:
    row = {field: result.get(field) for field in PROFILE_FIELDS}
    row["external_links"] = json.dumps(
        result.get("external_links") or [],
        ensure_ascii=False,
    )

    return row


def save_profiles_csv(path: Path, results: list[dict]) -> None:
    with path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=PROFILE_FIELDS)
        writer.writeheader()
        writer.writerows(to_csv_row(result) for result in results)


def save_review_csv(path: Path, results: list[dict]) -> None:
    fields = [
        "name",
        "institution",
        "scholarship_level",
        "match_status",
        "candidates_count",
        "review_reason",
        "candidate_names",
        "candidate_codes",
        "llm_review_status",
        "llm_review_confidence",
        "llm_review_reason",
        "error",
    ]

    with path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=fields)
        writer.writeheader()

        for result in results:
            writer.writerow(
                {
                    "name": result["name"],
                    "institution": result["institution"],
                    "scholarship_level": result["scholarship_level"],
                    "match_status": result["match_status"],
                    "candidates_count": result["candidates_count"],
                    "review_reason": result["review_reason"],
                    "candidate_names": " | ".join(
                        candidate.get("name", "") for candidate in result["candidates"]
                    ),
                    "candidate_codes": " | ".join(
                        candidate.get("lattes_code", "") for candidate in result["candidates"]
                    ),
                    "llm_review_status": result.get("llm_review_status"),
                    "llm_review_confidence": result.get("llm_review_confidence"),
                    "llm_review_reason": result.get("llm_review_reason"),
                    "error": result["error"],
                }
            )


def build_error_result(scholarship: dict, error: Exception) -> dict:
    return {
        "name": scholarship["name"],
        "institution": scholarship.get("institution", ""),
        "scholarship_level": scholarship.get("scholarship_level", ""),
        "match_status": "error",
        "review_reason": "Erro técnico durante scraping",
        "candidates_count": 0,
        "lattes_code": None,
        "lattes_name": None,
        "lattes_preview_url": None,
        "certified_at": None,
        "orcid": None,
        "external_links": [],
        "summary": None,
        "llm_review_status": None,
        "llm_review_confidence": None,
        "llm_review_reason": None,
        "error": str(error),
        "scholarship": scholarship,
        "candidates": [],
    }


async def enrich_person_safely(page, scholarship: dict, raw_dir: Path) -> dict:
    try:
        return await enrich_person(page, scholarship, raw_dir=raw_dir)
    except Exception as error:
        return build_error_result(scholarship, error)


async def retry_technical_errors(
    page,
    results: list[dict],
    raw_dir: Path,
    retry_count: int = TECHNICAL_ERROR_RETRIES,
) -> list[dict]:
    retry_log = []

    for retry_number in range(1, retry_count + 1):
        error_indexes = [
            index
            for index, result in enumerate(results)
            if result["match_status"] == "error"
        ]

        if not error_indexes:
            break

        print(
            f"Retry técnico {retry_number}/{retry_count}: {len(error_indexes)} casos",
            flush=True,
        )

        for position, result_index in enumerate(error_indexes, start=1):
            previous_result = results[result_index]
            scholarship = previous_result["scholarship"]
            name = scholarship["name"]

            print(
                f"  [{position}/{len(error_indexes)}] {name}",
                flush=True,
            )

            retried_result = await enrich_person_safely(
                page,
                scholarship,
                raw_dir=raw_dir / f"retry_{retry_number}",
            )
            results[result_index] = retried_result

            retry_log.append(
                {
                    "retry": retry_number,
                    "name": name,
                    "previous_error": previous_result.get("error"),
                    "match_status": retried_result["match_status"],
                    "review_reason": retried_result["review_reason"],
                    "error": retried_result.get("error"),
                }
            )

            print(
                f"    -> {retried_result['match_status']}: {retried_result['review_reason']}",
                flush=True,
            )

        await asyncio.sleep(1)

    return retry_log


def save_run_outputs(
    run_dir: Path,
    csv_path: Path,
    results: list[dict],
    retry_log: list[dict],
    llm_decisions: list[dict],
) -> None:
    review_results = [
        result for result in results if result["match_status"] != "matched"
    ]

    save_profiles_csv(run_dir / "lattes_profiles.csv", results)
    save_review_csv(run_dir / "review_queue.csv", review_results)

    (run_dir / "lattes_profiles.json").write_text(
        json.dumps(results, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    (run_dir / "review_queue.json").write_text(
        json.dumps(review_results, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    (run_dir / "retry_log.json").write_text(
        json.dumps(retry_log, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    (run_dir / "summary.json").write_text(
        json.dumps(
            {
                "source_csv": str(csv_path),
                "total": len(results),
                "matched": sum(1 for result in results if result["match_status"] == "matched"),
                "not_found": sum(1 for result in results if result["match_status"] == "not_found"),
                "ambiguous": sum(1 for result in results if result["match_status"] == "ambiguous"),
                "error": sum(1 for result in results if result["match_status"] == "error"),
                "technical_error_retries": TECHNICAL_ERROR_RETRIES,
                "retry_attempts": len(retry_log),
                "llm_review_attempts": len(llm_decisions),
                "llm_review_matched": sum(
                    1
                    for decision in llm_decisions
                    if decision.get("previous_status") != "matched"
                    and decision.get("final_status") == "matched"
                ),
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )


def save_full_outputs(run_dir: Path, source_csv: Path, results: list[dict]) -> None:
    review_results = [
        result for result in results if result["match_status"] != "matched"
    ]

    with (run_dir / "lattes_full_profiles.csv").open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=FULL_PROFILE_FIELDS)
        writer.writeheader()
        writer.writerows(make_full_csv_row(result) for result in results)

    with (run_dir / "review_queue_full.csv").open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=FULL_PROFILE_FIELDS)
        writer.writeheader()
        writer.writerows(make_full_csv_row(result) for result in review_results)

    (run_dir / "lattes_full_profiles.json").write_text(
        json.dumps(
            [make_full_json_row(result) for result in results],
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    (run_dir / "review_queue_full.json").write_text(
        json.dumps(review_results, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    (run_dir / "summary.json").write_text(
        json.dumps(
            {
                "source_csv": str(source_csv),
                "total": len(results),
                "matched": sum(1 for result in results if result["match_status"] == "matched"),
                "skipped": sum(1 for result in results if result["match_status"] == "skipped"),
                "error": sum(1 for result in results if result["match_status"] == "error"),
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )


def make_base_profile(row: dict) -> dict:
    return {
        "name": row.get("name"),
        "institution": row.get("institution"),
        "scholarship_level": row.get("scholarship_level"),
        "match_status": row.get("match_status"),
        "lattes_code": row.get("lattes_code"),
        "lattes_name": row.get("lattes_name"),
        "orcid": row.get("orcid"),
        "summary": row.get("summary"),
        "external_links": parse_json_cell(row.get("external_links"), []),
    }


def resolve_review(profiles_csv: Path, review_resolved_csv: Path) -> None:
    run_dir = create_run_dir(PREVIEW_RESULTS_DIR)

    with profiles_csv.open(newline="", encoding="utf-8") as file:
        profiles = list(csv.DictReader(file))

    with review_resolved_csv.open(newline="", encoding="utf-8") as file:
        resolved_rows = list(csv.DictReader(file))

    resolved_by_key = {profile_key(row): row for row in resolved_rows}
    output_rows = []
    applied = []
    unresolved = []

    for profile in profiles:
        resolved = resolved_by_key.get(profile_key(profile))

        if not resolved:
            output_rows.append(profile)

            if profile.get("match_status") != "matched":
                unresolved.append(profile)

            continue

        resolved_status = resolved.get("resolved_status") or resolved.get("match_status") or "matched"
        updated_profile = {**profile}
        updated_profile["match_status"] = resolved_status
        updated_profile["review_reason"] = resolved.get("notes") or "Resolvido manualmente"
        updated_profile["error"] = ""

        for field in [
            "lattes_code",
            "lattes_name",
            "lattes_preview_url",
            "certified_at",
            "orcid",
            "external_links",
            "summary",
        ]:
            if resolved.get(field):
                updated_profile[field] = resolved[field]

        output_rows.append(updated_profile)
        applied.append(
            {
                "name": profile.get("name"),
                "institution": profile.get("institution"),
                "previous_status": profile.get("match_status"),
                "resolved_status": resolved_status,
                "lattes_code": updated_profile.get("lattes_code"),
            }
        )

        if resolved_status != "matched":
            unresolved.append(updated_profile)

    matched_count = sum(1 for row in output_rows if row.get("match_status") == "matched")
    output_path = run_dir / "lattes_profiles_resolved.csv"
    unresolved_path = run_dir / "review_queue_remaining.csv"

    with output_path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=PROFILE_FIELDS)
        writer.writeheader()
        writer.writerows(
            {field: row.get(field, "") for field in PROFILE_FIELDS}
            for row in output_rows
        )

    with unresolved_path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=PROFILE_FIELDS)
        writer.writeheader()
        writer.writerows(
            {field: row.get(field, "") for field in PROFILE_FIELDS}
            for row in unresolved
        )

    (run_dir / "resolved_applied.json").write_text(
        json.dumps(applied, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    (run_dir / "summary.json").write_text(
        json.dumps(
            {
                "profiles_csv": str(profiles_csv),
                "review_resolved_csv": str(review_resolved_csv),
                "total": len(output_rows),
                "matched": matched_count,
                "remaining_review": len(unresolved),
                "resolved_applied": len(applied),
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    print(f"Results: {run_dir}", flush=True)
    print(f"Resolved CSV: {output_path}", flush=True)
    print(f"Remaining review: {unresolved_path}", flush=True)


async def search_person(name: str) -> None:
    chromium_path = which("chromium") or which("chromium-browser")
    run_dir = create_run_dir(PREVIEW_RESULTS_DIR)

    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(
            executable_path=chromium_path,
            headless=True,
        )

        try:
            page = await browser.new_page()
            result = await enrich_person(
                page,
                {
                    "name": name,
                    "institution": "",
                    "scholarship_level": "",
                },
                raw_dir=run_dir / "raw",
            )

            (run_dir / "profile.json").write_text(
                json.dumps(result, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
            (run_dir / "summary.json").write_text(
                json.dumps(
                    {
                        "name": name,
                        "match_status": result["match_status"],
                        "review_reason": result["review_reason"],
                        "candidates_count": result["candidates_count"],
                    },
                    ensure_ascii=False,
                    indent=2,
                ),
                encoding="utf-8",
            )

            print(f"Name: {name}")
            print(f"Results: {run_dir}")
            print(f"Match status: {result['match_status']}")
            print(f"Review reason: {result['review_reason']}")
            print(f"Candidates found: {result['candidates_count']}")

            for candidate in result["candidates"][:5]:
                print(f"- {candidate['name']}: {candidate['lattes_code']}")

            if result["match_status"] == "matched":
                print(f"Matched Lattes code: {result['lattes_code']}")
                print(f"Certified at: {result['certified_at']}")
                print(f"ORCID: {result['orcid']}")
                print(f"Profile: {run_dir / 'profile.json'}")
        finally:
            await browser.close()


async def scrape_full_cv(name: str, institution: str = "") -> None:
    chromium_path = which("chromium") or which("chromium-browser")
    run_dir = create_run_dir(FULL_RESULTS_DIR)

    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(
            executable_path=chromium_path,
            headless=True,
        )

        try:
            page = await browser.new_page()
            scholarship = {
                "name": name,
                "institution": institution,
                "scholarship_level": "",
            }
            result = None

            for attempt in range(1, TECHNICAL_ERROR_RETRIES + 2):
                result = await enrich_person_safely(
                    page,
                    scholarship,
                    raw_dir=run_dir / "raw" / f"match_attempt_{attempt}",
                )

                if result["match_status"] != "error":
                    break

                print(
                    f"Match attempt {attempt} failed: {result['error']}",
                    flush=True,
                )
                await asyncio.sleep(1)

            if result["match_status"] != "matched" or not result["lattes_code"]:
                (run_dir / "full_cv_result.json").write_text(
                    json.dumps(result, ensure_ascii=False, indent=2),
                    encoding="utf-8",
                )
                print(f"Name: {name}", flush=True)
                print(f"Results: {run_dir}", flush=True)
                print(f"Match status: {result['match_status']}", flush=True)
                print("Full CV skipped: no safe Lattes match", flush=True)
                return

            full_cv_url, full_cv_html, full_cv_text = await fetch_full_cv(
                page,
                result["lattes_code"],
            )
            full_cv_summary = {
                "name": name,
                "institution": institution,
                "lattes_code": result["lattes_code"],
                "full_cv_url": full_cv_url,
                "title": await page.title(),
                "text_length": len(full_cv_text),
                "looks_like_full_cv": looks_like_full_cv_text(full_cv_text),
                "blocked_or_invalid": is_full_cv_blocked_or_invalid(full_cv_text),
            }

            (run_dir / "full_cv.html").write_text(full_cv_html, encoding="utf-8")
            (run_dir / "full_cv.txt").write_text(full_cv_text, encoding="utf-8")
            (run_dir / "full_cv_result.json").write_text(
                json.dumps(
                    {
                        "match": result,
                        "full_cv": full_cv_summary,
                    },
                    ensure_ascii=False,
                    indent=2,
                ),
                encoding="utf-8",
            )

            print(f"Name: {name}", flush=True)
            print(f"Results: {run_dir}", flush=True)
            print(f"Lattes code: {result['lattes_code']}", flush=True)
            print(f"Full CV URL: {full_cv_url}", flush=True)
            print(f"Text length: {len(full_cv_text)}", flush=True)
            print(f"Looks like full CV: {full_cv_summary['looks_like_full_cv']}", flush=True)
            print(f"Blocked/invalid: {full_cv_summary['blocked_or_invalid']}", flush=True)
        finally:
            await browser.close()


async def scrape_full_cv_by_code(lattes_code: str) -> None:
    chromium_path = which("chromium") or which("chromium-browser")
    run_dir = create_run_dir(FULL_RESULTS_DIR)

    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(
            executable_path=chromium_path,
            headless=True,
        )

        try:
            page = await browser.new_page()
            full_cv_url, full_cv_html, full_cv_text = await fetch_full_cv(
                page,
                lattes_code,
            )
            full_cv_summary = {
                "lattes_code": lattes_code,
                "full_cv_url": full_cv_url,
                "title": await page.title(),
                "text_length": len(full_cv_text),
                "looks_like_full_cv": looks_like_full_cv_text(full_cv_text),
                "blocked_or_invalid": is_full_cv_blocked_or_invalid(full_cv_text),
            }

            (run_dir / "full_cv.html").write_text(full_cv_html, encoding="utf-8")
            (run_dir / "full_cv.txt").write_text(full_cv_text, encoding="utf-8")
            (run_dir / "full_cv_result.json").write_text(
                json.dumps(full_cv_summary, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )

            print(f"Results: {run_dir}", flush=True)
            print(f"Lattes code: {lattes_code}", flush=True)
            print(f"Full CV URL: {full_cv_url}", flush=True)
            print(f"Text length: {len(full_cv_text)}", flush=True)
            print(f"Looks like full CV: {full_cv_summary['looks_like_full_cv']}", flush=True)
            print(f"Blocked/invalid: {full_cv_summary['blocked_or_invalid']}", flush=True)
        finally:
            await browser.close()


def review_existing_profiles_with_llm(profiles_json_path: Path) -> None:
    run_dir = create_run_dir(PREVIEW_RESULTS_DIR)

    with profiles_json_path.open(encoding="utf-8") as file:
        results = json.load(file)

    llm_decisions = review_ambiguous_with_llm(results, run_dir)
    source_csv = profiles_json_path.with_suffix(".csv")
    save_run_outputs(run_dir, source_csv, results, retry_log=[], llm_decisions=llm_decisions)

    print(f"Results: {run_dir}", flush=True)
    print(f"Profiles CSV: {run_dir / 'lattes_profiles.csv'}", flush=True)
    print(f"Review queue: {run_dir / 'review_queue.json'}", flush=True)
    print(f"LLM review: {run_dir / 'llm_review.json'}", flush=True)


async def enrich_full_profiles(csv_path: Path, limit: int | None = None) -> Path:
    chromium_path = which("chromium") or which("chromium-browser")
    run_dir = create_run_dir(FULL_RESULTS_DIR)
    raw_dir = run_dir / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)

    with csv_path.open(newline="", encoding="utf-8") as file:
        rows = list(csv.DictReader(file))

    if limit is not None:
        rows = rows[:limit]

    results = []

    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(
            executable_path=chromium_path,
            headless=True,
        )

        try:
            page = await browser.new_page()

            for index, row in enumerate(rows, start=1):
                base_profile = make_base_profile(row)
                name = base_profile.get("name") or "unknown"
                lattes_code = base_profile.get("lattes_code")

                print(f"[{index}/{len(rows)}] {name}", flush=True)

                if row.get("match_status") != "matched" or not lattes_code:
                    result = {
                        **base_profile,
                        "match_status": "skipped",
                        "public_lattes_id": None,
                        "lattes_url": None,
                        "last_updated": None,
                        "full_cv_text_length": None,
                        "looks_like_full_cv": False,
                        "blocked_or_invalid": False,
                        "sections_count": 0,
                        "detail_json_path": None,
                        "raw_html_path": None,
                        "raw_text_path": None,
                        "error": "Registro sem match_status=matched ou sem lattes_code",
                        "sections_text": {},
                    }
                    results.append(result)
                    print("  -> skipped", flush=True)
                    continue

                person_dir = raw_dir / sanitize_filename(
                    f"{lattes_code}_{name}"
                )
                person_dir.mkdir(parents=True, exist_ok=True)

                try:
                    full_cv_url, full_cv_html, full_cv_text = await fetch_full_cv(
                        page,
                        lattes_code,
                    )
                    result = extract_full_cv_profile(full_cv_html, base_profile)
                    html_path = person_dir / "full_cv.html"
                    text_path = person_dir / "full_cv.txt"
                    detail_path = person_dir / "full_profile.json"

                    html_path.write_text(
                        full_cv_html,
                        encoding="utf-8",
                    )
                    text_path.write_text(
                        full_cv_text,
                        encoding="utf-8",
                    )
                    result["raw_html_path"] = str(html_path)
                    result["raw_text_path"] = str(text_path)
                    result["detail_json_path"] = str(detail_path)
                    result["sections_count"] = len(result.get("sections_text") or {})

                    if result["blocked_or_invalid"] or not result["looks_like_full_cv"]:
                        result["match_status"] = "error"
                        result["error"] = "Currículo completo inválido ou bloqueado"

                    detail = build_full_profile_detail(
                        result,
                        {
                            "raw_html_path": str(html_path),
                            "raw_text_path": str(text_path),
                        },
                    )
                    detail_path.write_text(
                        json.dumps(detail, ensure_ascii=False, indent=2),
                        encoding="utf-8",
                    )

                    print(
                        f"  -> {result['match_status']}: text_length={result['full_cv_text_length']}",
                        flush=True,
                    )
                except Exception as error:
                    result = {
                        **base_profile,
                        "match_status": "error",
                        "public_lattes_id": None,
                        "lattes_url": None,
                        "last_updated": None,
                        "full_cv_text_length": None,
                        "looks_like_full_cv": False,
                        "blocked_or_invalid": False,
                        "sections_count": 0,
                        "detail_json_path": None,
                        "raw_html_path": None,
                        "raw_text_path": None,
                        "error": str(error),
                        "sections_text": {},
                    }
                    print(f"  -> error: {error}", flush=True)

                results.append(result)
        finally:
            await browser.close()

    save_full_outputs(run_dir, csv_path, results)

    print(f"Results: {run_dir}", flush=True)
    print(f"Full profiles CSV: {run_dir / 'lattes_full_profiles.csv'}", flush=True)
    print(f"Review queue: {run_dir / 'review_queue_full.json'}", flush=True)

    return run_dir


async def enrich_scholarships(csv_path: Path, limit: int | None = None) -> Path:
    chromium_path = which("chromium") or which("chromium-browser")
    run_dir = create_run_dir(PREVIEW_RESULTS_DIR)
    raw_dir = run_dir / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)

    with csv_path.open(newline="", encoding="utf-8") as file:
        scholarships = list(csv.DictReader(file))

    if limit is not None:
        scholarships = scholarships[:limit]

    results = []
    retry_log = []
    llm_decisions = []

    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(
            executable_path=chromium_path,
            headless=True,
        )

        try:
            page = await browser.new_page()

            for index, scholarship in enumerate(scholarships, start=1):
                name = scholarship["name"]
                print(f"[{index}/{len(scholarships)}] {name}", flush=True)

                result = await enrich_person_safely(page, scholarship, raw_dir)
                results.append(result)
                print(
                    f"  -> {result['match_status']}: {result['review_reason']}",
                    flush=True,
                )

            retry_log = await retry_technical_errors(page, results, raw_dir)
        finally:
            await browser.close()

    llm_decisions = review_ambiguous_with_llm(results, run_dir)
    save_run_outputs(run_dir, csv_path, results, retry_log, llm_decisions)

    print(f"Results: {run_dir}", flush=True)
    print(f"Profiles CSV: {run_dir / 'lattes_profiles.csv'}", flush=True)
    print(f"Review queue: {run_dir / 'review_queue.json'}", flush=True)

    return run_dir


if __name__ == "__main__":
    command = sys.argv[1] if len(sys.argv) > 1 else "debug-form"

    if command == "debug-form":
        asyncio.run(debug_search_form())
    elif command == "search":
        if len(sys.argv) < 3:
            print("Usage: lattes_scrape.py search <person_name>")
            sys.exit(1)

        person_name = sys.argv[2]
        asyncio.run(search_person(person_name))
    elif command == "enrich-scholarships":
        source_csv = Path(sys.argv[2])
        row_limit = int(sys.argv[3]) if len(sys.argv) > 3 else None
        asyncio.run(enrich_scholarships(source_csv, limit=row_limit))
    elif command == "full-cv":
        if len(sys.argv) < 3:
            print("Usage: lattes_scrape.py full-cv <person_name> [institution]")
            sys.exit(1)

        person_name = sys.argv[2]
        institution_name = sys.argv[3] if len(sys.argv) > 3 else ""
        asyncio.run(scrape_full_cv(person_name, institution_name))
    elif command == "full-cv-code":
        lattes_code = sys.argv[2]
        asyncio.run(scrape_full_cv_by_code(lattes_code))
    elif command == "enrich-full":
        source_csv = Path(sys.argv[2])
        row_limit = int(sys.argv[3]) if len(sys.argv) > 3 else None
        asyncio.run(enrich_full_profiles(source_csv, limit=row_limit))
    elif command == "resolve-review":
        profiles_csv = Path(sys.argv[2])
        review_resolved_csv = Path(sys.argv[3])
        resolve_review(profiles_csv, review_resolved_csv)
    elif command == "llm-review-profiles":
        profiles_json = Path(sys.argv[2])
        review_existing_profiles_with_llm(profiles_json)
    else:
        print(f"Unknown command: {command}")
