import asyncio
import csv
import json
import re
import sys
from datetime import datetime
from pathlib import Path
from shutil import which
from urllib.parse import quote_plus, urljoin

from bs4 import BeautifulSoup
from playwright.async_api import async_playwright


SCHOLAR_BASE_URL = "https://scholar.google.com"
RESULTS_DIR = Path("scrape_results") / "scholar"
PROFILE_FIELDS = [
    "name",
    "institution",
    "match_status",
    "candidates_count",
    "review_reason",
    "scholar_name",
    "scholar_profile_url",
    "affiliation",
    "interests",
    "cited_by",
    "h_index",
    "i10_index",
    "error",
]


def create_run_dir() -> Path:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    run_dir = RESULTS_DIR / timestamp
    run_dir.mkdir(parents=True, exist_ok=True)

    return run_dir


def clean_text(value: str | None) -> str:
    return " ".join((value or "").split())


def normalize(value: str | None) -> str:
    return clean_text(value).casefold()


def search_url(name: str) -> str:
    return f"{SCHOLAR_BASE_URL}/citations?view_op=search_authors&mauthors={quote_plus(name)}&hl=en"


def extract_number(value: str | None) -> int | None:
    match = re.search(r"\d[\d,\.]*", value or "")

    if not match:
        return None

    return int(match.group(0).replace(",", "").replace(".", ""))


def extract_candidates(html: str) -> list[dict]:
    soup = BeautifulSoup(html, "html.parser")
    candidates = []

    for item in soup.select(".gsc_1usr"):
        name_link = item.select_one(".gs_ai_name a")
        name = clean_text(name_link.get_text(" ", strip=True)) if name_link else None
        href = name_link.get("href") if name_link else None
        affiliation = clean_text(item.select_one(".gs_ai_aff").get_text(" ", strip=True)) if item.select_one(".gs_ai_aff") else None
        cited_by = clean_text(item.select_one(".gs_ai_cby").get_text(" ", strip=True)) if item.select_one(".gs_ai_cby") else None
        interests = [
            clean_text(interest.get_text(" ", strip=True))
            for interest in item.select(".gs_ai_one_int")
        ]

        if not name:
            continue

        candidates.append(
            {
                "name": name,
                "profile_url": urljoin(SCHOLAR_BASE_URL, href or ""),
                "affiliation": affiliation,
                "interests": interests,
                "cited_by": extract_number(cited_by),
                "raw_cited_by": cited_by,
            }
        )

    return candidates


def scholar_access_error(html: str, current_url: str) -> str | None:
    page_text = clean_text(BeautifulSoup(html, "html.parser").get_text(" ", strip=True))

    if "accounts.google.com" in current_url or "Sign in to continue to Google Scholar" in page_text:
        return "Google Scholar redirecionou para login"

    if "unusual traffic" in page_text or "not a robot" in page_text:
        return "Google Scholar bloqueou a requisição com verificação anti-bot"

    return None


def choose_candidate(candidates: list[dict], name: str, institution: str) -> tuple[str, str, dict | None]:
    exact_name_candidates = [
        candidate
        for candidate in candidates
        if normalize(candidate["name"]) == normalize(name)
    ]

    if not candidates:
        return "not_found", "Nenhum candidato encontrado no Google Scholar", None

    if len(exact_name_candidates) == 1 and len(candidates) == 1:
        return "matched", "Único candidato com nome igual", exact_name_candidates[0]

    institution_matches = [
        candidate
        for candidate in exact_name_candidates or candidates
        if normalize(institution) and normalize(institution) in normalize(candidate.get("affiliation"))
    ]

    if len(institution_matches) == 1:
        return "matched", "Candidato escolhido por menção à instituição", institution_matches[0]

    return "ambiguous", "Mais de um candidato possível", None


def extract_profile_metrics(html: str) -> dict:
    soup = BeautifulSoup(html, "html.parser")
    metrics = {}

    rows = soup.select("#gsc_rsb_st tbody tr")

    for row in rows:
        label = clean_text(row.select_one(".gsc_rsb_sc1").get_text(" ", strip=True)) if row.select_one(".gsc_rsb_sc1") else ""
        value = clean_text(row.select_one(".gsc_rsb_std").get_text(" ", strip=True)) if row.select_one(".gsc_rsb_std") else ""

        if label == "Citations":
            metrics["cited_by"] = extract_number(value)
        elif label == "h-index":
            metrics["h_index"] = extract_number(value)
        elif label == "i10-index":
            metrics["i10_index"] = extract_number(value)

    return metrics


async def scrape_person(name: str, institution: str = "") -> None:
    chromium_path = which("chromium") or which("chromium-browser")
    run_dir = create_run_dir()

    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(
            executable_path=chromium_path,
            headless=True,
        )

        try:
            page = await browser.new_page()
            await page.goto(search_url(name), wait_until="domcontentloaded", timeout=30_000)

            search_html = await page.content()
            access_error = scholar_access_error(search_html, page.url)
            candidates = [] if access_error else extract_candidates(search_html)
            match_status, review_reason, candidate = (
                ("error", access_error, None)
                if access_error
                else choose_candidate(candidates, name, institution)
            )

            result = {
                "name": name,
                "institution": institution,
                "match_status": match_status,
                "candidates_count": len(candidates),
                "review_reason": review_reason,
                "scholar_name": None,
                "scholar_profile_url": None,
                "affiliation": None,
                "interests": [],
                "cited_by": None,
                "h_index": None,
                "i10_index": None,
                "error": access_error,
                "candidates": candidates,
            }

            (run_dir / "search_result.html").write_text(search_html, encoding="utf-8")
            (run_dir / "candidates.json").write_text(
                json.dumps(candidates, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )

            if candidate:
                await page.goto(
                    candidate["profile_url"],
                    wait_until="domcontentloaded",
                    timeout=30_000,
                )
                profile_html = await page.content()
                metrics = extract_profile_metrics(profile_html)

                (run_dir / "profile.html").write_text(profile_html, encoding="utf-8")
                result.update(
                    {
                        "scholar_name": candidate["name"],
                        "scholar_profile_url": candidate["profile_url"],
                        "affiliation": candidate["affiliation"],
                        "interests": candidate["interests"],
                        "cited_by": metrics.get("cited_by", candidate.get("cited_by")),
                        "h_index": metrics.get("h_index"),
                        "i10_index": metrics.get("i10_index"),
                    }
                )

            (run_dir / "profile.json").write_text(
                json.dumps(result, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )

            with (run_dir / "scholar_profiles.csv").open("w", newline="", encoding="utf-8") as file:
                writer = csv.DictWriter(file, fieldnames=PROFILE_FIELDS)
                writer.writeheader()
                row = {field: result.get(field) for field in PROFILE_FIELDS}
                row["interests"] = json.dumps(result["interests"], ensure_ascii=False)
                writer.writerow(row)

            print(f"Name: {name}")
            print(f"Results: {run_dir}")
            print(f"Match status: {match_status}")
            print(f"Candidates found: {len(candidates)}")
            print(f"Profile CSV: {run_dir / 'scholar_profiles.csv'}")
        finally:
            await browser.close()


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: scholar_scrape.py <person_name> <institution>")
        sys.exit(1)

    person_name = sys.argv[1]
    institution_name = sys.argv[2]
    asyncio.run(scrape_person(person_name, institution_name))
