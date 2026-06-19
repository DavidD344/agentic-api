# Agentic API: A Multi-Agent System for Collecting, Enriching, Visualizing and Querying CNPq Researcher Data

## Abstract

Academic institutions generate large volumes of public data about researchers, grants, institutions and scientific production, but this information is usually distributed across platforms designed for manual navigation. In Brazil, this problem appears in the relation between CNPq productivity scholarship tables and the Lattes Platform. This paper presents **Agentic API**, a multi-agent system that collects, enriches, stores, visualizes and queries CNPq Productivity Research scholarship data in Computer Science. The system extracts official CNPq rows, matches researchers with Lattes profiles, downloads curriculum artifacts and applies semantic enrichment through deterministic rules and Large Language Model (LLM) agents. Its core principle is that factual collection must be deterministic and auditable, while LLMs should be used only where semantic reasoning is useful. The active run processed 480 scholarship holders, matched 480 Lattes previews, extracted 480 full curricula and finished with zero final LLM errors after eight repairs.

## 1. Introduction

The Lattes Platform hosts millions of Brazilian academic curricula, while the CNPq Productivity Research Scholarship Program is one of the main national instruments for recognizing and fostering scientific output. To hold a CNPq scholarship, researchers are expected to maintain an active Lattes curriculum, but CNPq scholarship tables and Lattes profiles are not integrated in a single analytical view. This creates a practical problem for coordinators, professors and evaluators who need to know which institutions concentrate scholarships, which researchers work with robotics, how grants are distributed by region, or which candidates have international experience.

Agentic API addresses this gap through an end-to-end workflow over public CNPq and Lattes data. The system creates a structured base list of scholarship holders, enriches each person with Lattes data and semantic fields, and exposes the result through dashboard metrics, profile browsing, export and chat. Its objectives are to generate a dataset with fields such as name, institution, state, scholarship level, inferred sex, research area, doctorate year and Lattes URL; enrich the dataset with curriculum evidence; expose the data through application features; and reduce manual intervention through agents for orchestration, ambiguity resolution, validation, repair and question answering.

The central architectural decision is to separate factual extraction from semantic reasoning. CNPq and Lattes pages are collected by scrapers that preserve raw artifacts, while LLMs resolve ambiguous candidates, infer semantic fields and answer natural language questions. This reduces hallucination risk and makes the dataset easier to inspect, reproduce and defend.

## 2. Related Work

This project is related to Lattes data extraction, LLM-based multi-agent systems and retrieval-augmented question answering. Early systems such as scriptLattes and LattesMiner showed that Lattes curricula can be transformed into structured reports, datasets and indicators. They demonstrate the value of turning public curricula into analyzable artifacts, although large-scale access became harder after anti-automation barriers such as CAPTCHA.

More recent systems, including QLattes and Science Tree, use Lattes information for publication analysis or academic genealogy. They show that Lattes supports higher-level analysis, but not the specific workflow implemented here: starting from a CNPq scholarship table, matching each scholarship holder to Lattes, enriching the result semantically and exposing it through dashboard and natural language interfaces.

The project also follows the multi-agent pattern in which tasks are decomposed into responsibilities with inputs, tools, outputs and handoffs. Recent LLM-MAS work emphasizes decomposition, coordination and result aggregation; Agentic API adopts the same idea without forcing every agent to be an LLM. Some agents are scrapers, some are deterministic services and some are model calls. The natural language interface uses a hybrid RAG strategy: File Search and Vector Store support semantic retrieval, while exact counts, filters and rankings are computed by local structured queries over JSON.

## 3. The Solution

The proposed solution has two major parts: an administrative data preparation pipeline that builds the enriched dataset, and an application layer that exposes the active dataset to users. The pipeline executes collection, matching, enrichment and validation outside the normal request flow. The application layer handles health checks, dashboard metrics, profile search, export and chat.

At a high level, the flow is:

```txt
CNPq public table
  -> Collector Scraper
  -> base scholarship dataset
  -> Lattes Preview Agent
  -> ambiguity review when necessary
  -> Lattes Full Scraper
  -> Inference Agent
  -> normalization and review
  -> active dataset promotion
  -> Dashboard / Profile Search / Chat
```

### 3.1 Requirements

The assignment defined dataset generation, visualization, export, natural language consultation and reduced manual intervention as the main functional goals. The implementation also makes logging and multi-agent organization explicit because auditability and explainability are central to the solution.

**Table 1. Functional requirements of the proposed system**

| ID | Name | Description |
|---|---|---|
| FR1 | Dataset generation | Automatic creation of a structured dataset from the CNPq public scholarship table, including researcher name, inferred sex, institution, state (UF), scholarship level, expertise area, PhD year and Lattes URL. Google Scholar URL is treated as optional future enrichment. |
| FR2 | Dashboard | Interactive dashboard for visualization of collected and enriched researcher data. |
| FR3 | Data export | Export functionality for enriched profile data. The current implementation provides CSV export; PDF is a possible extension. |
| FR4 | Natural language interface | Interface allowing users to query the dataset using natural language. |
| FR5 | Operation logging | Logging and artifact system recording pipeline operations, intermediate outputs, review queues and agent decisions. |
| FR6 | Multi-agent architecture | Architecture based on specialized agents and processes for collection, enrichment, validation, search and question answering. |

Beyond the functional requirements, runs must be inspectable, LLM usage must be controlled because full curricula are large, and ambiguous cases must remain reviewable instead of being silently accepted.

### 3.2 Architecture

The architecture follows a layered design: scrapers, services, API routes and frontend components have separate responsibilities. The pipeline transforms public sources into an active enriched dataset, while the application consumes only the run selected by `scrape_results/current.json`. Failed runs and limited tests do not replace the active base. The main guardrails come from this separation: the LLM does not replace CNPq data, does not invent Lattes candidates, and does not calculate exact totals when backend tools can do so. Inferred fields include confidence, source and review flags, and sensitive fields such as `sex_inferred` are treated as approximate.

The chat follows the same architectural logic. It is not a single LLM call over the full dataset. The `query_planner_agent` decides which tools are necessary, `backend_tools` execute structured or semantic retrieval, and the `query_answer_agent` writes the final answer from a prepared evidence package. This costs more than a single prompt but reduces numerical hallucination and makes reasoning explicit.

#### 3.2.1 Pipeline Architecture

Each pipeline stage produces an explicit artifact for the next one. This prevents the system from depending on a single opaque prompt and allows individual stages to be inspected or repeated. The final promotion updates `current.json` only when the run is usable.

#### 3.2.2 Multi-Agent Architecture

The system contains 16 main agents or processes. The architecture intentionally distinguishes deterministic agents from LLM agents.

**Table 2. System components: agents and processes in the pipeline**

| # | Agent / Process | LLM | Default model | Responsibility |
|---:|---|---|---|---|
| 1 | `orchestrator_agent` | No | - | Coordinates pipeline execution, logs and dataset promotion. |
| 2 | `collector_scraper` | No | - | Extracts the official CNPq table. |
| 3 | `lattes_preview_agent` | Sometimes | `gpt-5.4-mini` when ambiguous | Searches Lattes candidates and resolves safe matches. |
| 4 | `lattes_review_llm` | Yes | `gpt-5.4-mini` | Resolves ambiguous Lattes candidates. |
| 5 | `lattes_full_scraper` | No | - | Downloads full Lattes curriculum artifacts. |
| 6 | `inference_agent` | Yes | `gpt-5-nano` | Generates semantic fields from curriculum data. |
| 7 | `inference_repair_agent` | Yes | `gpt-5.4-mini` | Repairs invalid inference outputs when validation fails. |
| 8 | `normalization_process` | No | - | Normalizes labels, UF, region and derived fields. |
| 9 | `sex_review_agent` | Yes | `gpt-5.4-nano` | Reviews unknown or low-confidence inferred sex cases. |
| 10 | `search_context_agent` | No | - | Builds compact context and search corpus. |
| 11 | `dashboard_agent` | No | - | Computes dashboard metrics. |
| 12 | `profile_search_agent` | No | - | Lists, filters and exports researcher profiles. |
| 13 | `query_planner_agent` | Yes | `gpt-5.4-mini` | Plans tools for natural language questions. |
| 14 | `backend_tools` | No | - | Executes structured queries, topic search, metrics and optional File Search. |
| 15 | `query_answer_agent` | Yes | `gpt-5.4-mini` | Validates context and writes the final answer. |
| 16 | `chat_title_agent` | Yes | `gpt-5.4-nano` | Generates short chat titles. |

#### 3.2.3 Handoffs

Handoffs are the contract between responsibilities. The same principle is used in the pipeline and in the chat: one component produces an artifact or decision, and the next consumes it.

**Table 3. Data flow between agents and processes**

| From | To | Handoff artifact or decision |
|---|---|---|
| Collector Scraper | Lattes Preview Agent | Base scholarship records extracted from the CNPq table. |
| Lattes Preview Agent | Lattes Review LLM | Candidate list and review queue for ambiguous matches. |
| Lattes Review LLM | Lattes Full Scraper | Resolved Lattes profile when ambiguity can be safely solved. |
| Lattes Full Scraper | Inference Agent | Raw HTML, cleaned curriculum text and structured profile JSON. |
| Inference Agent | Inference Repair Agent | Invalid or incomplete inference output requiring repair. |
| Inference / Repair | Normalization Process | Enriched profiles with semantic fields. |
| Normalization Process | Sex Review Agent | Profiles whose inferred sex remains unknown or low-confidence. |
| Final Dataset | Dashboard / Profile Search / Chat | Active JSON and CSV files promoted through `current.json`. |
| Query Planner Agent | Backend Tools | JSON plan specifying which tools should be executed. |
| Backend Tools | Query Answer Agent | Compact context package with evidence and computed results. |

#### 3.2.4 Tools

The project uses conventional APIs and local tools instead of a dedicated MCP server. This is intentional: the required operations are local and controlled, such as reading JSON, computing metrics, filtering profiles, executing scraping scripts and calling LLMs.

**Table 4. Main tools used by the system**

| Tool | Used by | Purpose |
|---|---|---|
| Playwright / Chromium | Collector Scraper, Lattes Preview Agent, Lattes Full Scraper | Navigate public CNPq and Lattes pages and access dynamic content. |
| BeautifulSoup | Scrapers and parsers | Parse HTML, extract tables, links and readable text. |
| CSV / JSON files | Pipeline stages and backend services | Store raw, intermediate and final artifacts in an auditable and exportable format. |
| OpenAI Responses API | LLM-based agents | Execute ambiguity resolution, semantic inference, repair, planning, response generation and title generation. |
| OpenAI Vector Store / File Search | Search Context Agent and chat agents | Provide optional semantic retrieval over the enriched corpus. |
| Structured Query Tool | Backend Tools and Query Planner Agent | Execute exact counts, filters, rankings and aggregations over local JSON. |
| Dashboard Metrics Service | Dashboard Agent and chat context | Precompute aggregated metrics for the frontend and query agents. |
| FastAPI | Backend routers and services | Expose health, dashboard, profile search, chat and pipeline routes. |
| Next / React | Frontend | Provide the dashboard, researcher search, chat and navigation interface. |

### 3.3 Implementation

The project is implemented as a Python FastAPI backend with a Next/React frontend. The backend follows a layered structure: `app/routers` exposes HTTP endpoints, `app/services` contains business logic, and `app/scrapers` contains the CNPq scraper, Lattes scraper, inference pipeline and normalization scripts. Datasets and manifests are stored under `scrape_results`, and pipeline logs are stored under `logs`. The frontend is intentionally a consumption layer.

#### 3.3.1 Data Preparation Pipeline Implementation

The `orchestrator_agent` coordinates execution, creates timestamped runs, records logs and promotes a run only when usable. The `collector_scraper` opens the CNPq page and extracts researcher name, scholarship level, start and end dates, institution and situation. This stage is deterministic because the source is already a structured public table.

The base records go to the `lattes_preview_agent`, which searches Lattes and collects candidate profiles. Safe matches proceed automatically. Ambiguous cases are sent to `lattes_review_llm`, constrained to choose only among collected candidates. In the active run, 480 researchers were processed, 480 profiles were matched and four cases used LLM review.

After resolution, the `lattes_full_scraper` downloads raw HTML, cleaned text and structured JSON with public URL, summary, page sections and photo URL when available. These artifacts support inference, debugging and reprocessing. The `inference_agent` uses `gpt-5-nano` to generate semantic fields; invalid outputs go to `inference_repair_agent` with `gpt-5.4-mini`.

After inference, deterministic normalization fixes predictable variations, including English region labels, missing institution-UF mappings and scholarship groupings. When `sex_inferred` remains uncertain, `sex_review_agent` may use linguistic evidence from names and gender-marked Lattes text. This inference is used only for aggregate visualization, not as an official demographic record.

The final dataset is stored as CSV and JSON. CSV supports inspection and export; JSON preserves nested semantic fields. The active dataset is selected through `scrape_results/current.json`, not by scanning folders. Each profile includes base fields plus a `semantic_profile` envelope with `value`, `confidence`, `source`, `reason` and `needs_review`.

#### 3.3.2 Search Corpus, Vector Store and Minimal Context

After promotion, `search_context_agent` builds `profiles_search_corpus.json` for semantic retrieval and `minimal_profiles_context.json`/`.txt` for compact global context. The local JSON dataset remains the source for exact structured operations. The corpus and optional Vector Store support open-ended questions.

#### 3.3.3 Natural Language Chat Implementation

The planner receives the user question, tool descriptions, dataset structure, dashboard metrics and minimal profile context. It returns a structured plan indicating whether to use local structured query, topic candidate search, dashboard metrics, File Search or a combination. Backend tools execute the plan. The answer agent receives the question, recent history and evidence package, then explains the result without presenting unsupported claims as facts.

#### 3.3.4 Dashboard Metrics

The `/dashboard/metrics` route computes metrics before sending them to the frontend. The dashboard includes general cards, scholarship distributions, regional distributions, state rankings, inferred sex distribution, doctorate year ranges, concentration by institution and cross-tabs by area, region, sex and scholarship level.

#### 3.3.5 Profile Search and Export

The `/profiles` routes allow users to browse researchers, search by name, institution, area, topic or text, filter by institution, scholarship, inferred sex and region, open Lattes URLs and export selected data as CSV. Search normalizes accents, underscores and variants such as `robotica` and `robotics`.

#### 3.3.6 Frontend Consumption Layer

The frontend consumes FastAPI routes and renders login, navigation, dashboard, profile search and chat. It does not run scraping, compute official metrics or perform LLM reasoning, keeping the backend as the single source of truth.

#### 3.3.7 Logs, Review Artifacts and Auditability

Each important step saves artifacts: pipeline logs, summaries, retry logs, LLM review files, inference logs, review queues, normalization logs, sex review logs and chat session files. Instead of one monolithic log, each stage produces files related to its responsibility.

#### 3.3.8 ADRs

ADRs document decisions such as deterministic scraping for factual collection, local CSV/JSON storage, staged execution, LLM use only for ambiguity and semantics, structured backend tools for exact counts, optional Vector Store and conventional APIs instead of MCP. They are available in the project repository at `https://github.com/DavidD344/agentic-api/tree/master/ADR`.

#### 3.3.9 Testing, Validation and Deployment

Validation was incremental. The CNPq scraper was checked through generated tables and CSV files. Lattes preview was tested on one researcher, subsets and all 480 records. Full extraction was inspected through HTML, text and JSON. Inference was first tested on samples; the repair agent was added for invalid outputs; dashboard metrics and chat answers were validated against active JSON.

The active run summary is also a validation artifact: 480 profiles processed, 480 Lattes previews matched, 480 full curricula extracted, zero final LLM errors and eight invalid inference outputs repaired successfully. The system does not claim perfect inferred fields; it records confidence, review flags and logs. The project is designed primarily for local execution and classroom demonstration with Uvicorn/FastAPI, Next and optional ngrok exposure.

## 4. Lessons Learned

The most successful decision was separating factual extraction from semantic reasoning. CNPq and Lattes scraping produce concrete artifacts, while LLMs are used only where interpretation is needed. This made the system easier to debug, explain and defend academically.

The staged pipeline reduced development risk because each stage could be executed, inspected and repeated independently. If later stages failed, earlier artifacts were still preserved. The active manifest `current.json` created a clear boundary between experimental runs and the dataset consumed by the application.

The chat architecture also produced an important lesson. A single LLM call is not reliable enough for structured analysis, especially for counts, rankings or filtered groups. The planner-tool-answer flow is more defensible because the planner chooses tools, the backend computes data and the answer agent explains the result. The trade-off is cost.

The main limitations are scraping fragility, LLM cost and incomplete semantic inference. Future work includes publication-level inference, collaboration networks, Google Scholar enrichment, a Full CV Tool for detailed individual questions, relational storage, production authentication, adaptive context selection, review screens and possible MCP integration.

## 5. Conclusion

Agentic API implements a complete multi-agent workflow for collecting, enriching, visualizing and querying CNPq productivity scholarship data in Computer Science. It starts from a public CNPq table, extracts scholarship data deterministically, matches researchers with Lattes profiles, downloads full curricula, generates semantic fields and exposes the final dataset through dashboard, profile search and natural language chat.

The implementation covers dataset generation, dashboard, export, natural language querying and agent-supported reduction of manual intervention, with logs and ADRs supporting auditability. Although limited by scraping fragility and LLM cost, it provides a defensible foundation for research data analysis.

## 6. References

[1] CNPq. Plataforma Lattes. Official public curriculum platform.

[2] CNPq. Bolsas de Produtividade em Pesquisa. Official information about productivity scholarships.

[3] CNPq. Public productivity scholarship result table used as the initial data source for the project.

[4] Mena-Chalco, J. P., and Cesar Junior, R. M. scriptLattes: an open-source knowledge extraction system from the Lattes platform.

[5] Alves et al. LattesMiner: a tool for extracting structured information from Lattes curricula.

[6] Mendonca et al. QLattes: enrichment and analysis of Lattes publications.

[7] Cota et al. Science Tree: Brazilian academic genealogy based on Lattes data.

[8] Lewis et al. Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks.

[9] Gao et al. Retrieval-Augmented Generation survey and taxonomy.

[10] OpenAI. Responses API, File Search and Vector Store documentation.

[11] Project ADRs, documentation and source code in the `agentic-api` repository.
