import asyncio
import csv
import json
import re
import sys
from datetime import datetime
from pathlib import Path
from shutil import which
from urllib.parse import urljoin

from bs4 import BeautifulSoup
from playwright.async_api import async_playwright


DEFAULT_NAME = "Abilio Pereira de Lucena Filho"
LATTES_SEARCH_URL = "https://buscatextual.cnpq.br/buscatextual/busca.do?metodo=apresentar"
LATTES_BASE_URL = "https://buscatextual.cnpq.br/buscatextual/"
RESULTS_DIR = Path("scrape_results") / "lattes"
DETAIL_PATTERN = re.compile(
    r"abreDetalhe\('(?P<code>[^']+)','(?P<slug>[^']+)',(?P<person_id>\d+),?"
)
DATE_PATTERN = re.compile(r"Certificado pelo autor em\s*(\d{2}/\d{2}/\d{4})")
PROFILE_FIELDS = [
    "name",
    "institution",
    "scholarship_level",
    "match_status",
    "review_reason",
    "candidates_count",
    "lattes_code",
    "lattes_name",
    "lattes_preview_url",
    "certified_at",
    "orcid",
    "summary",
    "error",
]


def create_run_dir() -> Path:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    run_dir = RESULTS_DIR / timestamp
    run_dir.mkdir(parents=True, exist_ok=True)

    return run_dir


async def debug_search_form() -> None:
    chromium_path = which("chromium") or which("chromium-browser")
    run_dir = create_run_dir()

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


def clean_text(value: str) -> str:
    return " ".join(value.split())


def normalize(value: str | None) -> str:
    return clean_text(value or "").casefold()


def sanitize_filename(value: str) -> str:
    normalized = re.sub(r"[^a-zA-Z0-9_-]+", "_", value.strip())
    return normalized.strip("_")[:120] or "unknown"


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


async def enrich_person(page, scholarship: dict, raw_dir: Path | None = None) -> dict:
    name = scholarship["name"]
    institution = scholarship.get("institution", "")

    search_html = ""
    search_text = ""
    candidates = []

    for attempt in range(1, 4):
        await submit_search(page, name)

        search_html = await page.content()
        search_text = BeautifulSoup(search_html, "html.parser").get_text(" ", strip=True)
        candidates = extract_result_candidates(search_html)

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

    for candidate in candidates[:5]:
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
        "summary": None,
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
                "summary": matched_profile.get("summary"),
            }
        )

    return result


def to_csv_row(result: dict) -> dict:
    return {field: result.get(field) for field in PROFILE_FIELDS}


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
        "review_reason",
        "candidates_count",
        "candidate_names",
        "candidate_codes",
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
                    "review_reason": result["review_reason"],
                    "candidates_count": result["candidates_count"],
                    "candidate_names": " | ".join(
                        candidate.get("name", "") for candidate in result["candidates"]
                    ),
                    "candidate_codes": " | ".join(
                        candidate.get("lattes_code", "") for candidate in result["candidates"]
                    ),
                    "error": result["error"],
                }
            )


async def search_person(name: str) -> None:
    chromium_path = which("chromium") or which("chromium-browser")
    run_dir = create_run_dir()

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


async def enrich_scholarships(csv_path: Path, limit: int | None = None) -> None:
    chromium_path = which("chromium") or which("chromium-browser")
    run_dir = create_run_dir()
    raw_dir = run_dir / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)

    with csv_path.open(newline="", encoding="utf-8") as file:
        scholarships = list(csv.DictReader(file))

    if limit is not None:
        scholarships = scholarships[:limit]

    results = []

    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(
            executable_path=chromium_path,
            headless=True,
        )

        try:
            page = await browser.new_page()

            for index, scholarship in enumerate(scholarships, start=1):
                name = scholarship["name"]
                print(f"[{index}/{len(scholarships)}] {name}")

                try:
                    result = await enrich_person(page, scholarship, raw_dir=raw_dir)
                except Exception as error:
                    result = {
                        "name": name,
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
                        "summary": None,
                        "error": str(error),
                        "scholarship": scholarship,
                        "candidates": [],
                    }

                results.append(result)
                print(f"  -> {result['match_status']}: {result['review_reason']}")
        finally:
            await browser.close()

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
    (run_dir / "summary.json").write_text(
        json.dumps(
            {
                "source_csv": str(csv_path),
                "total": len(results),
                "matched": sum(1 for result in results if result["match_status"] == "matched"),
                "not_found": sum(1 for result in results if result["match_status"] == "not_found"),
                "ambiguous": sum(1 for result in results if result["match_status"] == "ambiguous"),
                "error": sum(1 for result in results if result["match_status"] == "error"),
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    print(f"Results: {run_dir}")
    print(f"Profiles CSV: {run_dir / 'lattes_profiles.csv'}")
    print(f"Review queue: {run_dir / 'review_queue.json'}")


if __name__ == "__main__":
    command = sys.argv[1] if len(sys.argv) > 1 else "debug-form"

    if command == "debug-form":
        asyncio.run(debug_search_form())
    elif command == "search":
        person_name = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_NAME
        asyncio.run(search_person(person_name))
    elif command == "enrich-scholarships":
        source_csv = Path(sys.argv[2])
        row_limit = int(sys.argv[3]) if len(sys.argv) > 3 else None
        asyncio.run(enrich_scholarships(source_csv, limit=row_limit))
    else:
        print(f"Unknown command: {command}")
