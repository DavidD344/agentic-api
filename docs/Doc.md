# Multi-Agent System for Data Collection, Querying, and Visualization

**Course:** MATA 62 – Software Engineering I  
**Students:** David Freitas, Melissa Victor  
**Repository:** https://github.com/DavidD344/agentic-api  
**Status:** Under development

---

## Table of Contents

1. [Requirements](#1-requirements)
2. [Design](#2-design)
   - 2.1 Overview
   - 2.2 Flow
   - 2.3 Orchestrator
   - 2.4 Handoffs
   - 2.5 Tools
   - 2.6 Guardrails
   - 2.7 Reasoning and Planning
   - 2.8 Collaboration
   - 2.9 MCP
3. [Implementation](#3-implementation)
   - 3.1 Technologies
   - 3.2 Project Structure
   - 3.3 Agent Structure
4. [Testing](#4-testing)
5. [Deployment](#5-deployment)
6. [ADRs](#6-adrs)

---

## 1. Requirements

### 1.1 Functional Requirements

| ID | Description | Status |
|----|-------------|--------|
| FR01 | Generate a dataset containing name, gender, institution, state (UF), scholarship level, research area, PhD graduation year, Lattes URL, and Google Scholar profile for CNPq PQ scholarship holders in Computer Science | Partially implemented — Google Scholar and gender still pending |
| FR02 | Provide a dashboard for data visualization | Pending |
| FR03 | The dashboard must allow exporting selected data as PDF and CSV files | Pending |
| FR04 | Provide an interface for querying information via natural language | Pending |
| FR05 | Generate a log of all operations performed by the system | Implemented — logs at `logs/pipeline_<timestamp>.log` |

### 1.2 Dataset Fields

Fields are collected from three different sources:

| Field | Source |
|-------|--------|
| name, institution, state (UF), scholarship level, start/end date, status | CNPq (public table) |
| PhD year, Lattes URL, research area, summary, ORCID, photo | Lattes |
| Google Scholar URL | Google Scholar *(pending)* |
| gender | Inferred by LLM from the Lattes summary |

Beyond the required fields, the current pipeline also collects and infers:

- Institution state and Brazilian region
- Secondary research areas, topics, methods, and application domains
- Career stage and academic seniority
- International, industrial, management, and editorial experience
- Patents and software outputs
- Summaries and tags for dashboard and chat

### 1.3 Non-Functional Requirements

**Auditability:** each pipeline run saves its results in a timestamped folder, enabling comparison between runs and traceability of problems.

**Reproducibility:** runs with a person limit are treated as test samples and do not overwrite active data. The system retains snapshots of each execution.

**Resilience:** the system does not halt on ambiguous cases. Those cases are placed in a review queue (`review_queue.csv`) and the pipeline continues.

**Traceability:** all LLM-inferred fields record the inference origin (`source`), confidence level (`confidence`), and whether human review is needed (`needs_review`).

---

## 2. Design

### 2.1 Overview

The system consists of a data collection and enrichment pipeline, a FastAPI-based API, and future modules for a dashboard and natural language querying.

Collection starts from a public CNPq table of PQ scholarship holders in Computer Science. From that table, the system searches for and enriches each person's data using Lattes and, in the future, Google Scholar. The enriched data feeds the API, which exposes metrics to the dashboard and answers natural language queries.

The pipeline follows the architectural principle:

```
router → service → scraper
```

Scrapers know how to collect data. Services (future) coordinate business rules. Routers only expose HTTP.

### 2.2 Flow

The complete pipeline flow is:

```
Step 0: CNPq
  simple_scrape.py
  → scrape_results/<run>/scholarships.csv

Step 1: Lattes Preview/Match
  lattes_scrape.py enrich-scholarships
  → scrape_results/lattes_preview/<run>/lattes_profiles.csv
  → scrape_results/lattes_preview/<run>/review_queue.csv

  (Optional: LLM review of ambiguous cases)
  (Optional: manual review via review_resolved.csv)

Step 2: Lattes Full Curriculum
  lattes_scrape.py enrich-full
  → scrape_results/lattes_full/<run>/lattes_full_profiles.json
  → scrape_results/lattes_full/<run>/raw/<person>/full_cv.txt

Step 3: Semantic Inferences
  inference_scrape.py
  → scrape_results/inferences/<run>/profiles_with_inferences.json
  → scrape_results/inferences/<run>/inference_review_queue.csv

Active Manifest
  → scrape_results/current.json

Logs
  → logs/pipeline_<timestamp>.log
```

After the pipeline, the API exposes the active data:

```
GET /                    → status and active run data
GET /dashboard/metrics   → aggregated metrics for the dashboard
```

Planned future routes:

```
GET /profiles            → paginated list of enriched profiles
GET /profiles/{code}     → detail for a single person
POST /chat               → natural language query
POST /pipeline/run       → triggers the pipeline via API
```

### 2.3 Orchestrator

The current orchestrator is `pipeline_scrape.py`. It is a Python script, not an LLM agent, because the sequence of steps is deterministic: CNPq must run before Lattes Preview, which must run before Full, which must run before Inferences.

Orchestrator responsibilities:

- Execute steps in sequence
- Pass each step's output files as input to the next step
- Record the full execution log
- Decide whether the run should be promoted as active in `current.json`
- Never promote limited runs, runs with errors, or runs with a non-empty review queue

Promotion criteria for `current.json`:

```
promoted = true only when:
  - run has no person limit
  - full step completed without errors
  - summary.error == 0
  - summary.skipped == 0
  - review_queue_full is empty
```

System agent diagram (complete planned design):

```
                         ┌──────────────────────────┐
                         │       orchestrator        │
                         │   (pipeline_scrape.py)    │
                         └────────────┬─────────────┘
              ┌───────────────────────┼───────────────────────┐
              ▼                       ▼                        ▼
 ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────────┐
 │ lattesResearch   │   │    inference     │   │   scholarResearch    │
 │ lattes_scrape.py │   │inference_scrape  │   │  scholar_scrape.py   │
 │                  │   │                  │   │     (pending)        │
 └────────┬─────────┘   └────────┬─────────┘   └──────────┬───────────┘
          └────────────────┬──────┘                       │
                           ▼                              │
                      ┌─────────┐◄────────────────────────┘
                      │ Dataset │
                      └────┬────┘
                  ┌────────┴────────┐
                  ▼                 ▼
           ┌────────────┐    ┌─────────────┐
           │report_agent│    │ query_agent │
           │ (pending)  │    │  (pending)  │
           └─────┬──────┘    └──────┬──────┘
                 └────────┬─────────┘
                          ▼
                    ┌───────────┐
                    │ Dashboard │
                    │ (pending) │
                    └───────────┘
```

> **Note:** the `collector` (`simple_scrape.py`) is a deterministic scraper with no LLM — it is not an agent and does not appear in this diagram. `genderGuesser_agent` was eliminated — gender inference is handled by `inference_scrape.py` (see ADR-004).

### 2.4 Handoffs

Handoffs between system components happen through CSV and JSON files, not real-time calls between agents. This ensures that each step can be independently re-executed and audited.

| From | Payload | To |
|------|---------|-----|
| Orchestrator | CNPq table URL | `simple_scrape.py` (collector) |
| Collector | `scholarships.csv` (name, institution, scholarship level) | `lattes_scrape.py` (lattesResearch) |
| lattesResearch (preview) | `lattes_profiles.csv` (lattes_code, match_status) | `lattes_scrape.py` (full) |
| lattesResearch (full) | `lattes_full_profiles.json` (full curriculum) | `inference_scrape.py` |
| Inference | `profiles_with_inferences.json` (semantic profile, incl. `sex_inferred`) | API / dashboard / chat |
| LLM (match review) | `llm_review.json` (chosen lattes_code, confidence) | `lattes_scrape.py` |
| LLM (inferences) | `semantic_profile` fields per person | `profiles_with_inferences.json` |

> **Components removed from the active flow:** `scholarResearch_agent` (on standby) and `genderGuesser_agent` (eliminated — gender is inferred by `inference_scrape.py`, see ADR-004).

Possible profile states throughout the pipeline:

```
matched     → passed all steps, reliable data
ambiguous   → candidates found, but no safe decision → goes to review_queue
not_found   → no candidates found on Lattes
error       → technical failure (timeout, block) → automatic retry attempted
skipped     → excluded from full/inferences because lattes_code is missing or match_status != matched
```

### 2.5 Tools

| Tool | Usage | Where |
|------|-------|-------|
| Playwright | Opens CNPq and Lattes pages that require a real browser to render | `simple_scrape.py`, `lattes_scrape.py` |
| BeautifulSoup4 | Parses HTML after Playwright loads the page | `lattes_scrape.py` |
| OpenAI SDK | LLM calls for ambiguity resolution and semantic inference generation | `lattes_scrape.py`, `inference_scrape.py` |
| FastAPI + Uvicorn | Exposes data over HTTP | `app/main.py` |
| httpx | Auxiliary HTTP requests | project dependency |
| python-dotenv | Loads environment variables from `.env` | all scrapers |
| uv | Dependency management and project execution | environment |

### 2.6 Guardrails

Guardrails are rules that prevent incorrect or low-quality data from advancing through the pipeline without review.

**Lattes match guardrail:**
The LLM may only promote a case from `ambiguous` to `matched` if three conditions are simultaneously met: (1) it returns valid JSON, (2) it chooses a `lattes_code` that was in the search candidate list, and (3) it declares confidence ≥ 0.85. If any condition fails, the case remains `ambiguous`.

**Active run promotion guardrail:**
A run only replaces `current.json` if it has no person limit, no errors, no skipped entries, and an empty review queue. Test runs never overwrite good data.

**False positive guardrail:**
The full curriculum is only downloaded for profiles with `match_status=matched` and a filled `lattes_code`. This prevents accidentally associating the wrong curriculum with a person.

**Sensitive data guardrail:**
The `sex_inferred` field is conservative by default. When there is no clear textual evidence in the summary, the value is `unknown`. The field is marked `needs_review=true` whenever confidence is low.

**LLM cost guardrail:**
Runs with `INFERENCES_LLM_LIMIT` are treated as test samples and do not promote `current.json`. The pipeline estimates token usage before each run (`prompt_tokens_estimate = chars / 4`) and logs it in `inference_llm.json`.

### 2.7 Reasoning and Planning

The system uses the LLM at two distinct moments with different objectives:

**Ambiguity resolution in Lattes Preview**

When the Lattes text search returns multiple candidates for the same person and name/institution comparison is not enough to make a safe choice, the LLM receives the case data — name, expected institution, scholarship level as auxiliary context, summary, external links, and `lattes_code` for each candidate — and decides which curriculum belongs to the person. The LLM does not require the preview to mention the CNPq scholarship; name, institution, and academic area with sufficient strength already form a basis for decision.

**Semantic inferences (Step 3)**

The goal is to transform the raw public curriculum into a structured semantic profile that can be used by the dashboard, filters, searches, and chat without re-reading the full curriculum at every query. Reasoning happens in five calls per person (default `split` mode):

```
1. rule_validation
   Validates and corrects locally-generated rule fields (UF, region, level,
   PhD year, inferred gender).

2. semantic_generation:research
   Generates primary area, secondary areas, topics, methods, and domains.

3. semantic_generation:career
   Generates career stage, academic role, and seniority.

4. semantic_generation:experience_outputs
   Generates experience flags (international, industrial, management, editorial,
   patents/software). This is the only phase that receives evidence_snippets
   extracted from the raw full curriculum.

5. semantic_generation:dashboard_qa
   Generates short summary, bullets, keywords, tags, chart suggestions,
   and qa_context for chat.
```

There is an experimental `single` mode that attempts everything in one call, but the default is `split` because it reduces the risk of malformed JSON and forgotten fields.

If a call fails, the system automatically attempts to repair only that specific case with a configurable repair model (`INFERENCES_REPAIR_LLM_MODEL`), without reprocessing all 480 people.

### 2.8 Collaboration

In the current pipeline, steps are sequential because each depends on the previous step's output. However, the design allows for parallelism within some steps:

- In Lattes Preview, searches for different people are independent of each other and could run in parallel (within Lattes rate limits).
- In the inference step, each person has their own `semantic_profile` and the five LLM calls for one person are sequential, but different people are independent of each other.

The original draft planned that after the `collector_agent`, all other agents could run in parallel (lattesResearch + scholarResearch + genderGuesser simultaneously). This architecture remains valid for the future version with Google Scholar.

### 2.9 MCP

MCP (Model Context Protocol) usage is not yet implemented. The future design envisions the `query_agent` exposing tools via MCP to allow the chat LLM to access structured system data:

```
tool: search_profiles(query)        → search profiles by term
tool: get_profile(lattes_code)      → detail for a single person
tool: list_by_area(area)            → profiles by research area
tool: get_dashboard_metrics()       → aggregated metrics
```

---

## 3. Implementation

### 3.1 Technologies

| Technology | Version | Role |
|-----------|---------|------|
| Python | ≥ 3.14 | Primary language |
| FastAPI | ≥ 0.136 | API framework |
| Uvicorn | ≥ 0.48 | ASGI server |
| Playwright | ≥ 1.60 | Browser automation for scraping |
| BeautifulSoup4 | ≥ 4.14 | HTML parsing |
| OpenAI SDK | ≥ 2.38 | LLM calls |
| httpx | ≥ 0.28 | HTTP requests |
| python-dotenv | ≥ 1.2 | Environment variable management |
| uv | — | Package manager and environment |
| Chromium | — | Real browser for Playwright (system-installed) |

### 3.2 Project Structure

```
agentic-api/
│
├── app/
│   ├── main.py                    # FastAPI API — root route and /dashboard/metrics
│   └── scrapers/
│       ├── simple_scrape.py       # Step 0: collects the CNPq table
│       ├── lattes_scrape.py       # Steps 1 & 2: Lattes preview and full curriculum
│       ├── scholar_scrape.py      # Future: Google Scholar scraping
│       ├── inference_scrape.py    # Step 3: semantic inferences via LLM
│       └── pipeline_scrape.py    # Orchestrator: runs all 4 steps in sequence
│
├── docs/
│   ├── Doc.md                # Full documentation
│   └── adr/                       # Formal ADRs in MADR 4.0 format
│       ├── ADR-001-isolated-pipeline-steps.md
│       ├── ADR-002-playwright-scraping.md
│       ├── ADR-003-scraping-api-separation.md
│       ├── ADR-004-llm-lattes-ambiguities.md
│       ├── ADR-005-precomputed-inferences.md
│       └── ADR-006-review-queue-false-negative.md
│
├── scrape_results/
│   ├── current.json               # Active run manifest
│   ├── <run_cnpq>/                # CNPq step output
│   ├── lattes_preview/<run>/      # Preview output
│   ├── lattes_full/<run>/         # Full curriculum output
│   │   └── raw/<person>/          # HTML, TXT, and detailed JSON per person
│   ├── inferences/<run>/          # Inference output
│   └── pipeline/<run>/            # Full pipeline summary
│
├── logs/
│   └── pipeline_<timestamp>.log   # Log for each pipeline execution
│
├── main.py                        # Alternative entry point
├── pyproject.toml                 # Project dependencies
├── README.md
└── .python-version                # Python version pin
```

### 3.3 Agent Structure

The system maps the agents from the original design to concrete code components:

| Agent (design) | Component (code) | Status |
|----------------|-----------------|--------|
| `orchestrator_agent` | `app/scrapers/pipeline_scrape.py` | Implemented |
| `collector_agent` | `app/scrapers/simple_scrape.py` | Implemented |
| `lattesResearch_agent` | `app/scrapers/lattes_scrape.py` | Implemented |
| `inference_agent` | `app/scrapers/inference_scrape.py` | Implemented |
| `scholarResearch_agent` | `app/scrapers/scholar_scrape.py` | On standby |
| `genderGuesser_agent` | Absorbed into `inference_scrape.py` (`sex_inferred` field) | Implemented via LLM |
| `query_agent` | Future chat service | Pending |
| `report_agent` | Future report/export service | Pending |

**Internal structure of an agent (scraper)**

Each scraper follows the same internal pattern:

```
1. Read input (CSV, JSON, or URL)
2. Process each item (with automatic retry for technical errors)
3. Classify the result (matched / ambiguous / not_found / error)
4. Call the LLM when enabled and needed
5. Save results in a timestamped folder
6. Generate summary.json with counts and file paths
```

**Structure of an inferred field**

All fields in the `semantic_profile` share the same envelope:

```json
{
  "value": "...",
  "confidence": 0.9,
  "source": "llm",
  "reason": "Short reason for the inference.",
  "needs_review": false
}
```

Possible `source` values: `rule`, `rule:lattes_text`, `rule+llm_validated`, `llm_corrected_rule`, `llm`.

---

## 4. Testing

### 4.1 Current Strategy

The project uses an incremental sample-based testing approach. Before running the full pipeline with all 480 people, it can be tested with a smaller number:

```bash
# Test full pipeline with 10 people
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/pipeline_scrape.py 10

# Test only preview with 10 people
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/lattes_scrape.py enrich-scholarships scholarships.csv 10

# Test inferences with 3 people
INFERENCES_LLM_LIMIT=3 env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/inference_scrape.py current
```

Limited runs are explicitly treated as samples and do not promote `current.json`.

### 4.2 Syntax Validation

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python -m py_compile \
  app/scrapers/simple_scrape.py \
  app/scrapers/lattes_scrape.py \
  app/scrapers/inference_scrape.py \
  app/scrapers/pipeline_scrape.py
```

### 4.3 Run Quality Criteria

A healthy full run should present:

```
summary.matched  == 480
summary.skipped  == 0
summary.error    == 0
llm_errors       == 0
review_queue_full is empty
```

The `inference_review_queue.csv` file may contain items without indicating an error — those cases require subsequent human review.

### 4.4 Result Auditing

Each run generates auditable files that allow verifying data quality:

- `summary.json` per step with counts
- `llm_review.json` with LLM decisions during preview
- `inference_llm.json` with all calls, accepted fields, and token estimates
- `review_queue.csv` with cases that need attention
- `raw/<person>/full_cv.txt` with the raw curriculum for manual comparison

---

## 5. Deployment

### 5.1 Prerequisites

```
uv installed
Python ≥ 3.14 (managed by uv via .python-version)
Chromium installed on the system
OPENAI_API_KEY configured in .env
```

On Arch/Manjaro:
```bash
sudo pacman -S chromium
```

### 5.2 Installation

```bash
# Clone the repository
git clone https://github.com/DavidD344/agentic-api.git
cd agentic-api

# Install dependencies
uv sync

# Create .env file
cp .env.example .env
# Edit .env and fill in OPENAI_API_KEY
```

### 5.3 Environment Variables

```bash
# LLM for Lattes match resolution
OPENAI_API_KEY=your-key
LATTES_LLM_MODEL=gpt-4o-mini
LATTES_DISABLE_LLM=1        # disables LLM in preview

# LLM for semantic inferences
INFERENCES_LLM_MODEL=gpt-4o-mini
INFERENCES_LLM_MODE=split   # recommended default
INFERENCES_DISABLE_LLM=1    # disables LLM in inferences
INFERENCES_LLM_LIMIT=10     # limits to N people (test mode)
INFERENCES_REPAIR_LLM_MODEL=gpt-4o-mini
```

### 5.4 Running the Pipeline

```bash
# Full pipeline
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/pipeline_scrape.py

# Limited pipeline (test with 10 people)
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/pipeline_scrape.py 10
```

### 5.5 Starting the API

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run uvicorn app.main:app --reload
```

Check status:
```bash
curl http://localhost:8000/
```

### 5.6 Checking the Active Run

```bash
cat scrape_results/current.json
```

---

## 6. ADRs

Architectural decisions have been documented in MADR 4.0 format and are located in the `docs/adr/` folder.

| ADR | Title | Status |
|-----|-------|--------|
| [ADR-001](docs/adr/ADR-001-isolated-pipeline-steps.md) | Pipeline structured as isolated steps with timestamped snapshots | Accepted |
| [ADR-002](docs/adr/ADR-002-playwright-scraping.md) | Use of Playwright for scraping dynamically rendered pages | Accepted |
| [ADR-003](docs/adr/ADR-003-scraping-api-separation.md) | Separation of scraping from the API layer (router→service→scraper) | Accepted |
| [ADR-004](docs/adr/ADR-004-llm-lattes-ambiguities.md) | Use of LLM for resolving Lattes match ambiguities | Accepted |
| [ADR-005](docs/adr/ADR-005-precomputed-inferences.md) | Precomputed semantic inferences before chat and dashboard | Accepted |
| [ADR-006](docs/adr/ADR-006-review-queue-false-negative.md) | Prefer reviewable false negatives over silent false positives | Accepted |
