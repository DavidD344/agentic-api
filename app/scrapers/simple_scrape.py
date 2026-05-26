import asyncio
import csv
import json
import re
import sys
from datetime import datetime
from pathlib import Path
from shutil import which

from bs4 import BeautifulSoup
from playwright.async_api import async_playwright


DEFAULT_URL = "http://plsql1.cnpq.br/divulg/RESULTADO_PQ_102003.prc_comp_cmt_links?V_COD_DEMANDA=200310&V_TPO_RESULT=CURSO&V_COD_AREA_CONHEC=10300007&V_COD_CMT_ASSESSOR=CC"
RESULTS_DIR = Path("scrape_results")
SCHOLARSHIP_FIELDS = [
    "name",
    "scholarship_level",
    "scholarship_start",
    "scholarship_end",
    "institution",
    "situation",
]
DATE_PATTERN = re.compile(r"^\d{2}/\d{2}/\d{4}$")


def create_run_dir() -> Path:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    run_dir = RESULTS_DIR / timestamp
    run_dir.mkdir(parents=True, exist_ok=True)

    return run_dir


def extract_links(soup: BeautifulSoup) -> list[dict]:
    return [
        {
            "label": link.get_text(strip=True),
            "href": link.get("href"),
        }
        for link in soup.find_all("a")
        if link.get("href")
    ]


def extract_tables(soup: BeautifulSoup) -> list[list[list[str]]]:
    tables = []

    for table in soup.find_all("table"):
        rows = []

        for row in table.find_all("tr"):
            cells = row.find_all(["th", "td"])
            values = [cell.get_text(separator=" ", strip=True) for cell in cells]

            if values:
                rows.append(values)

        if rows:
            tables.append(rows)

    return tables


def save_table_csv(path: Path, rows: list[list[str]]) -> None:
    max_columns = max(len(row) for row in rows)

    with path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow([f"col_{index}" for index in range(1, max_columns + 1)])

        for row in rows:
            writer.writerow(row)


def extract_scholarships(tables: list[list[list[str]]]) -> list[dict]:
    scholarships = []
    seen = set()

    for table in tables:
        for row in table:
            if len(row) != len(SCHOLARSHIP_FIELDS):
                continue

            if not DATE_PATTERN.match(row[2]) or not DATE_PATTERN.match(row[3]):
                continue

            scholarship = dict(zip(SCHOLARSHIP_FIELDS, row))
            scholarship_key = tuple(scholarship.values())

            if scholarship_key in seen:
                continue

            seen.add(scholarship_key)
            scholarships.append(scholarship)

    return scholarships


def save_scholarships_csv(path: Path, scholarships: list[dict]) -> None:
    with path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=SCHOLARSHIP_FIELDS)
        writer.writeheader()
        writer.writerows(scholarships)


async def scrape(url: str) -> None:
    chromium_path = which("chromium") or which("chromium-browser")
    run_dir = create_run_dir()

    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(
            executable_path=chromium_path,
            headless=True,
        )

        try:
            page = await browser.new_page()
            await page.goto(url, wait_until="domcontentloaded", timeout=30_000)

            title = await page.title()
            html = await page.content()
            soup = BeautifulSoup(html, "html.parser")

            text = soup.get_text(separator=" ", strip=True)
            links = extract_links(soup)
            tables = extract_tables(soup)
            scholarships = extract_scholarships(tables)

            (run_dir / "page.html").write_text(html, encoding="utf-8")
            (run_dir / "text.txt").write_text(text, encoding="utf-8")
            (run_dir / "links.json").write_text(
                json.dumps(links, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
            (run_dir / "tables.json").write_text(
                json.dumps(tables, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )

            for index, rows in enumerate(tables, start=1):
                save_table_csv(run_dir / f"table_{index}.csv", rows)

            save_scholarships_csv(run_dir / "scholarships.csv", scholarships)
            (run_dir / "scholarships.json").write_text(
                json.dumps(scholarships, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )

            summary = {
                "url": url,
                "title": title,
                "text_length": len(text),
                "links_count": len(links),
                "tables_count": len(tables),
                "scholarships_count": len(scholarships),
            }
            (run_dir / "summary.json").write_text(
                json.dumps(summary, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )

            print(f"URL: {url}")
            print(f"Title: {title}")
            print(f"Results: {run_dir}")
            print(f"Text preview: {text[:500]}")
            print(f"Links found: {len(links)}")
            print(f"Tables found: {len(tables)}")
            print(f"Scholarships found: {len(scholarships)}")

            for index, table in enumerate(tables, start=1):
                print(f"- table_{index}.csv: {len(table)} rows")
        finally:
            await browser.close()


if __name__ == "__main__":
    target_url = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_URL
    asyncio.run(scrape(target_url))
