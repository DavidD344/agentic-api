# Agentic API: A Multi-Agent System for Collecting, Enriching, Visualizing and Querying CNPq Researcher Data

## Report Structure

1. Introduction
2. Related Work
3. The Solution
   1. Requirements
   2. Architecture
   3. Implementation
4. Lessons Learned
5. Conclusion
6. References
7. Appendix - Replication Package

---

## 1. Introduction

Academic research institutions generate large volumes of public data about researchers, grants, institutions, projects and scientific production. However, this information is often distributed across different platforms and is rarely integrated in a way that supports aggregated analysis, interactive visualization or natural language querying.

In Brazil, this problem is particularly visible in the relation between CNPq productivity scholarships and the Lattes Platform. CNPq publishes public tables of productivity scholarship holders, while Lattes stores the official academic curricula of Brazilian researchers. Both sources are important, but they are designed mainly for manual navigation. A coordinator, professor or evaluator who wants to answer questions such as "which institutions concentrate more scholarships?", "which researchers work with robotics?", "what is the distribution of scholarships by region?", or "which candidates have international experience?" must manually combine information from multiple pages.

This project addresses that gap by implementing **Agentic API**, a multi-agent system that collects, enriches, stores, visualizes and queries data about CNPq productivity scholarship holders in Computer Science. The system starts from the public CNPq scholarship table, extracts the official scholarship data, matches each person with their Lattes profile, downloads the full curriculum when possible and then applies semantic enrichment using a controlled combination of deterministic rules and Large Language Model (LLM) agents.

The core architectural principle is that factual data collection should be deterministic and auditable, while LLM agents should be used only where semantic reasoning is useful. Therefore, the CNPq table and Lattes pages are collected through scrapers, while LLMs are used for tasks such as resolving ambiguous Lattes candidates, generating semantic fields from curriculum text and answering natural language questions over the final dataset. This separation reduces hallucination risk and makes the generated dataset easier to inspect, reproduce and defend.

The final system exposes the enriched dataset through a FastAPI backend and a Next/React frontend. The user can access a dashboard, browse and filter researcher profiles, and ask natural language questions through a multi-agent chat. The system also stores intermediate artifacts, logs, review queues and Architecture Decision Records (ADRs), making the pipeline explainable and reproducible.

The objectives of the project are fourfold. First, the system must generate a structured dataset with scholarship holder data, including name, institution, state, scholarship level, inferred sex, research area, doctorate year, Lattes URL and other relevant profile information. Second, it must enrich this dataset with Lattes information and semantic inferences. Third, it must expose the resulting data through a dashboard, profile search and export features. Finally, it must reduce manual intervention by using agents for orchestration, ambiguity resolution, validation, repair and natural language interaction.

> **Figure placeholder 1 - General system overview.**  
> Insert the complete flowchart from `fluxograma.pdf`, showing the path from CNPq data to scraping, Lattes matching, inference, FastAPI, dashboard, profile search and chat.

---

## 2. Related Work

This project is related to three main research and engineering areas: extraction of data from the Lattes ecosystem, multi-agent systems based on LLMs, and retrieval-augmented question answering over structured datasets.

Early systems such as **scriptLattes** and **LattesMiner** demonstrated that it is possible to extract structured information from Lattes curricula and generate reports, datasets and academic indicators. These tools are important references because they show the value of transforming Lattes data into structured artifacts. However, direct large-scale access to Lattes curricula became more difficult after the introduction of anti-automation barriers such as CAPTCHA, which limited approaches that depend on unrestricted bulk access.

More recent projects explored different uses of Lattes data. Systems such as QLattes and Science Tree use Lattes information to enrich publication analysis or to build academic genealogy networks. These systems show that Lattes can support higher-level analysis, but they do not directly solve the specific problem addressed here: starting from a public CNPq scholarship table, matching each scholarship holder with a Lattes profile, enriching the dataset semantically and exposing it through dashboard and natural language interfaces.

The project is also related to LLM-based multi-agent systems. In this type of architecture, complex tasks are decomposed into specialized agents, each one with a role, an input, a set of tools and an output that can be handed off to another agent. This design is useful when a system needs planning, tool use, validation and controlled collaboration instead of a single generic prompt. In Agentic API, not every agent is an LLM. Some agents are scrapers, some are deterministic backend services and some are actual LLM calls. Thus, the adopted definition of an agent is not restricted to a language model. In this project, an agent is an isolated responsibility with a clear input, tool, output and handoff.

Finally, the natural language interface is related to Retrieval-Augmented Generation (RAG). In this project, the OpenAI Vector Store and File Search compose the retrieval part of the RAG architecture: the enriched corpus is indexed once, relevant passages are retrieved for semantic questions, and the answer agent uses those passages during generation. However, the system does not rely only on semantic retrieval. For exact counts, filters and rankings, the backend executes local structured queries over JSON data. File Search and Vector Store are used for open-ended semantic retrieval, but numerical answers should come from deterministic backend tools whenever possible. This hybrid strategy reduces hallucination risk and makes the answers more auditable.

Overall, previous work supports the feasibility of extracting Lattes data, building multi-agent workflows and using LLMs for semantic interpretation. The contribution of this project is the integration of these ideas in a single end-to-end system: deterministic CNPq collection, Lattes matching, full curriculum extraction, LLM-assisted ambiguity handling, semantic inference, dashboard, profile search and chat.

---

## 3. The Solution

The proposed solution follows the flow represented in the project flowchart. The pipeline starts from a public CNPq page, creates a base list of scholarship holders, enriches each person with Lattes data, applies semantic inference and then serves the final dataset through backend and frontend features.

At a high level, the system follows the sequence below:

```txt
CNPq public table
  -> Collector Scraper
  -> base scholarship dataset
  -> Lattes Preview Agent
  -> ambiguity review when necessary
  -> Lattes Full Scraper
  -> Inference Agent
  -> normalized final dataset
  -> FastAPI Backend
  -> Dashboard / Profile Search / Chat
```

The central architectural decision is that **scraping is used for factual collection**, and **LLMs are used for semantic decisions**. This prevents the LLM from inventing official data and keeps raw artifacts available for auditing. The flow also makes it possible to reprocess only specific stages without repeating the entire pipeline.

### 3.1 Requirements

The assignment defined five main functional requirements. The first requirement, RF01, is the generation of a dataset from the CNPq page, containing at least name, inferred sex, institution, state, scholarship level, research area, doctorate completion year and profile URL. The second requirement, RF02, is the provision of a dashboard for data visualization. The third requirement, RF03, is the ability to export selected data. The fourth requirement, RF04, is a natural language interface for consultation. The fifth requirement, RF05, is the reduction of manual intervention through agent-supported decision points. In this requirement, deterministic scrapers perform factual collection, while agents support orchestration, ambiguity resolution, error handling, validation, repair and dataset promotion.

Beyond the functional requirements, the project also includes non-functional concerns that directly influenced the architecture. The dataset must be auditable, because it is built from public sources and may be used to support academic analysis. Runs must be reproducible, or at least inspectable, through saved intermediate artifacts. LLM usage must be controlled because full curricula are large and repeated model calls can become expensive. Finally, ambiguous cases must remain reviewable instead of being silently accepted.

These requirements motivated a layered design in which scraping, services, API routes and frontend components are separated. They also motivated the use of ADRs to record design decisions and the creation of a multi-agent model in which each agent has a specific responsibility.

### 3.2 Architecture

The architecture is composed of two major parts: an administrative data preparation pipeline that builds the dataset, and an application layer that exposes the active dataset to users. The pipeline is not offline, since some stages depend on external web sources and LLM API calls. Its role is to execute the heavier collection, matching, enrichment and validation stages outside the normal request-response flow of the user interface. The application layer is responsible for health checks, dashboard metrics, profile search, export and chat.

This section describes the system at the architectural level: responsibilities, agents, handoffs, tools and guardrails. The detailed technical behavior of each stage is presented later in Section 3.3.

#### 3.2.1 Pipeline Architecture

At the architectural level, the data preparation pipeline is a staged flow that transforms public, fragmented sources into an active enriched dataset. The central idea is simple: collect factual data deterministically, use agents only where interpretation or decision-making is required, and publish only a valid run as the active dataset consumed by the application.

The pipeline can be summarized as follows:

```txt
CNPq table
  -> base scholarship records
  -> Lattes preview matching
  -> ambiguity review when required
  -> full Lattes curriculum extraction
  -> semantic inference and repair
  -> normalization and review
  -> active dataset promotion
```

Each stage has a clear responsibility and hands an explicit artifact to the next stage. This design prevents the architecture from depending on a single opaque model call and makes the generated data easier to audit. The implementation details of each stage, including file names, models and validation artifacts, are described in Section 3.3.2.

> **Figure placeholder 2 - Data pipeline detail.**  
> Insert a diagram focusing only on CNPq collection, Lattes preview, ambiguity review, Lattes full scraping, inference and dataset promotion.

#### 3.2.2 Multi-Agent Architecture

The system contains 16 main agents or processes. They are not all LLMs. The architecture intentionally distinguishes deterministic agents from LLM agents. In particular, the inference and repair responsibilities are represented as different agents because they have different goals, models and decision points.

| # | Agent / Process | LLM | Default model | Responsibility |
|---:|---|---|---|---|
| 1 | `orchestrator_agent` | No | - | Coordinates pipeline execution, logs and dataset promotion. |
| 2 | `collector_scraper` | No | - | Extracts the official CNPq table. |
| 3 | `lattes_preview_agent` | Sometimes | `gpt-5.4-mini` when ambiguous | Searches Lattes candidates and resolves safe matches. |
| 4 | `lattes_review_llm` | Yes | `gpt-5.4-mini` | Resolves ambiguous Lattes candidates. |
| 5 | `lattes_full_scraper` | No | - | Downloads full Lattes curriculum artifacts. |
| 6 | `inference_agent` | Yes | `gpt-5-nano` | Generates semantic fields from curriculum data. |
| 7 | `inference_repair_agent` | Yes | `gpt-5.4-mini` | Repairs invalid inference outputs when the first inference call fails validation. |
| 8 | `normalization_process` | No | - | Normalizes labels, UF, region and derived fields. |
| 9 | `sex_review_agent` | Yes | `gpt-5.4-nano` | Reviews unknown inferred sex cases. |
| 10 | `search_context_agent` | No | - | Builds compact context and search corpus. |
| 11 | `dashboard_agent` | No | - | Computes dashboard metrics. |
| 12 | `profile_search_agent` | No | - | Lists, filters and exports researcher profiles. |
| 13 | `query_planner_agent` | Yes | `gpt-5.4-mini` | Plans which tools are needed for a natural language question. |
| 14 | `backend_tools` | No | - | Executes structured queries, topic search, metrics and optional File Search. |
| 15 | `query_answer_agent` | Yes | `gpt-5.4-mini` | Validates the context and writes the final answer. |
| 16 | `chat_title_agent` | Yes | `gpt-5.4-nano` | Generates short chat titles. |

This model satisfies the multi-agent requirement without forcing every component to be an LLM. In the project, an agent is defined by its responsibility and handoff, not only by the technology used to implement it. This distinction is important because the most reliable solution for official data collection is a deterministic scraper, while the most appropriate solution for ambiguity and semantic interpretation is an LLM-assisted agent.

#### 3.2.3 Handoffs

The agents collaborate through explicit handoffs. A handoff is the contract between two responsibilities: one component produces an artifact or decision, and the next component consumes it. This makes the flow inspectable and avoids hidden dependencies between agents.

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

The same principle is used both in the data pipeline and in the chat. The planner does not answer the user directly; it decides which tools are needed. The answer agent does not scan the entire system freely; it receives a prepared context package and writes the final response from that evidence.

#### 3.2.4 Tools

The project uses conventional APIs and local tools instead of a dedicated MCP server. The main tools are Playwright and Chromium for browser automation, BeautifulSoup for HTML parsing, CSV and JSON files for storage, FastAPI for backend routes, the OpenAI Responses API for LLM calls, OpenAI File Search and Vector Store for optional semantic retrieval, and Next/React for the frontend.

The following table summarizes the main tools, the agents or components that use them, and their role in the system.

| Tool | Used by | Purpose |
|---|---|---|
| Playwright / Chromium | Collector Scraper, Lattes Preview Agent, Lattes Full Scraper | Navigate public CNPq and Lattes pages and access dynamically rendered content when necessary. |
| BeautifulSoup | Scrapers and parsers | Parse HTML, extract tables, links and readable text from collected pages. |
| CSV / JSON files | Pipeline stages and backend services | Store raw, intermediate and final artifacts in an auditable and exportable format. |
| OpenAI Responses API | Lattes Review Agent, Inference Agent, Inference Repair Agent, Sex Review Agent, Query Planner Agent, Query Answer Agent and Chat Title Agent | Execute controlled LLM calls for ambiguity resolution, semantic inference, repair, planning, response generation and title generation. |
| OpenAI Vector Store / File Search | Search Context Agent and chat agents | Provide the retrieval component of the RAG flow over the enriched search corpus. |
| Structured Query Tool | Backend Tools and Query Planner Agent | Execute exact counts, filters, rankings and aggregations over the local JSON dataset. |
| Dashboard Metrics Service | Dashboard Agent and chat context | Precompute aggregated metrics used by the frontend and by the query agents. |
| FastAPI | Backend routers and services | Expose health, dashboard, profile search, chat and pipeline administration routes. |
| Next / React | Frontend | Provide the user interface for dashboard, researcher search, chat and navigation. |

The decision not to implement a custom MCP server is intentional. The required tools are local and controlled: reading JSON, filtering profiles, computing metrics, executing scraping scripts and calling LLMs. Implementing MCP would add complexity that is not necessary for the current version. The system still documents tools, handoffs and guardrails, and MCP can be added later if external tool integration becomes necessary.

#### 3.2.5 Guardrails

The main guardrails are derived from the separation between factual data and semantic interpretation. The LLM does not replace the CNPq source and does not invent Lattes candidates. Lattes ambiguity review chooses only among scraped candidates. Counts and rankings are calculated by backend tools whenever possible, and Vector Store is used for semantic retrieval rather than exact totals.

In the chat, the planner cannot execute arbitrary code. It can only request known backend tools with supported fields and operators. In the pipeline, raw HTML, text, CSV and JSON artifacts are saved for audit. Failed runs do not replace the active dataset. Inferred fields include confidence, source and review flags. Sensitive fields such as `sex_inferred` are explicitly treated as approximate and inferential.

#### 3.2.6 Reasoning, Planning and Collaboration

Reasoning appears mainly in the natural language interface. The chat is not implemented as a single LLM call over the entire dataset. Instead, it is implemented as a collaboration between a planning agent, deterministic backend tools and an answer agent.

The Query Planner Agent receives the user question and decides which tools are necessary. The backend executes the selected tools: structured query for exact counts and filters, topic candidate search for semantic themes, dashboard metrics for summaries, and optional File Search over the Vector Store for open-ended retrieval. The Query Answer Agent then receives the selected evidence and produces the final answer.

This design costs more than a single prompt, but it makes reasoning explicit and reduces numerical hallucination. It also reflects the intended multi-agent pattern: one agent plans, deterministic tools execute, and another agent validates and communicates the result.

> **Figure placeholder 3 - Chat agent flow.**  
> Insert a diagram showing Query Planner Agent, Backend Tools, optional Vector Store, Context Package and Query Answer Agent.

### 3.3 Implementation

The project is implemented as a Python FastAPI backend with a Next/React frontend. The backend is responsible for scraping, dataset loading, metrics, chat orchestration, profile search and pipeline administration. The frontend provides the user-facing dashboard, profile search and chat screens.

While Section 3.2 presents the architecture at a conceptual level, this section provides the denser technical view. It follows the implementation order: backend structure, data preparation pipeline, final dataset, search corpus and minimal context, chat process, dashboard metrics, profile search and frontend consumption.

#### 3.3.1 Backend

The backend follows a layered structure. The `app/routers` package exposes HTTP endpoints. The `app/services` package contains business logic such as dataset loading, dashboard metrics, chat orchestration and profile search. The `app/scrapers` package contains the CNPq scraper, Lattes scraper, inference pipeline and normalization scripts. Generated datasets, raw files, summaries, review queues and manifests are stored under `scrape_results`, while pipeline logs are stored under `logs`.

The main backend dependencies are FastAPI, Uvicorn, Playwright, BeautifulSoup, the OpenAI SDK and Python dotenv. The API includes routes for health check, authentication, dashboard metrics, profile search, export, chat sessions and pipeline administration.

| Route | Purpose |
|---|---|
| `GET /` | Health check, active dataset status and scraping status. |
| `POST /login` | Demo authentication for the frontend. |
| `GET /dashboard/metrics` | Aggregated metrics for the dashboard. |
| `GET /profiles` | Search, filter and paginate researcher profiles. |
| `GET /profiles/export.csv` | Export selected profile data. |
| `GET /profiles/{profile_id}` | Retrieve profile details. |
| `POST /session` | Create a chat session. |
| `GET /session` | List chat sessions. |
| `GET /session/{session_id}/message` | List messages from a legacy frontend session. |
| `POST /session/{session_id}/message` | Send a chat question through the legacy frontend route. |
| `POST /chat/corpus/rebuild` | Rebuild the local semantic search corpus. |
| `POST /chat/vector-store/sync` | Synchronize the optional OpenAI Vector Store. |
| `POST /chat/sessions/{session_id}/ask` | Send a chat question through the newer chat API. |
| `POST /admin/pipeline/run` | Start the pipeline from the API. |
| `GET /admin/pipeline/status` | Check whether the pipeline is running. |
| `GET /admin/pipeline/history` | List previous pipeline executions started through the API. |

The active dataset is loaded through `scrape_results/current.json`. In the documented run, it points to the CNPq run `scrape_results/20260526_210837`, the Lattes preview run `scrape_results/lattes_preview/20260526_210838`, the Lattes full run `scrape_results/lattes_full/20260526_212601` and the inference run `scrape_results/inferences/20260527_174328`. The active final dataset contains 480 profiles.

#### 3.3.2 Data Preparation Pipeline Implementation

This subsection provides the technical detail behind the architectural pipeline described earlier. It is intentionally more concrete than the architecture section, because it follows the complete flow and identifies which agent or process is responsible for each transformation and handoff.

The pipeline starts with the `orchestrator_agent`. Its role is not to scrape or infer data directly, but to coordinate the execution, create a timestamped run, call each stage in order, record logs and promote a run only when the resulting dataset is usable. This agent is important because the system is not a collection of independent scripts; it is a controlled workflow in which one stage produces the artifact required by the next stage.

The first operational stage is executed by the `collector_scraper`. It opens the public CNPq page, extracts the scholarship table and generates the base scholarship dataset. The extracted fields are the researcher name, scholarship level, scholarship start date, scholarship end date, institution and situation. This stage does not use LLMs because the source page already contains a structured table. A deterministic scraper is more appropriate because it preserves the row-level information of the official source and avoids asking a model to recreate factual data.

The base scholarship records are handed to the `lattes_preview_agent`. For each researcher, this agent searches the Lattes public interface and collects candidate profiles, including candidate name, Lattes code, preview summary and related links. When there is a single reliable candidate, the pipeline proceeds automatically. When there are multiple candidates or insufficient evidence, the case is handed to the `lattes_review_llm`, which uses `gpt-5.4-mini`. This LLM agent is constrained by design: it can only choose among candidates already collected by the scraper. It cannot invent a Lattes code, invent a profile or override the source data. If the ambiguity cannot be solved safely, the case remains reviewable instead of being silently accepted. In the documented active run, the preview stage processed 480 researchers, matched 480 profiles and used LLM review in 4 ambiguous cases.

After a Lattes profile is resolved, the handoff goes to the `lattes_full_scraper`. This process downloads the complete curriculum page for each resolved Lattes code and stores raw HTML, cleaned text and structured JSON artifacts. It also extracts information such as public URL, summary, links, page sections and photo URL when available. This stage is deterministic by default. Its purpose is to create auditable evidence that can support later inference, debugging and reprocessing.

The full curriculum artifacts are then handed to the `inference_agent`. This agent uses `gpt-5-nano` as the default model and transforms the Lattes content into fields that are useful for dashboard, profile search and chat. Some fields are rule-derived, such as institution state, institution region, scholarship category and years since doctorate. Other fields are inferred or validated from curriculum text, such as main research area, secondary areas, topics, methods, application domains, career stage, seniority, international experience, management experience and short profile summaries. The output is validated against the expected schema. If the response is invalid, incomplete or malformed, the case is not discarded; it is handed to a distinct `inference_repair_agent`, which uses `gpt-5.4-mini`. This separation keeps the normal inference path cheaper while reserving a stronger model for repair.

In practice, this model selection made the dataset generation economically viable for the project scale. A complete dataset generation run, including LLM-supported inference and repair for the 480 profiles, cost less than three US dollars in API usage during development.

After inference, the `normalization_process` applies deterministic corrections. It fixes predictable label variations, such as regions accidentally generated in English, missing institution-to-UF mappings and normalized scholarship groupings. Then, when `sex_inferred` remains unknown or low-confidence, the case can be handed to the `sex_review_agent`, which uses `gpt-5.4-nano`. This inference is based on linguistic evidence such as the researcher's full name and gender-marked words in the Lattes text, including adjectives and role descriptions such as "professor/professora", "pesquisador/pesquisadora" or "doutor/doutora". Therefore, `sex_inferred` is explicitly treated as an approximation for aggregated statistics, not as an official demographic record.

The final pipeline handoff is dataset promotion. The `orchestrator_agent` updates `scrape_results/current.json` only when the run is usable. This manifest points to the current CNPq run, Lattes preview run, Lattes full run, inference run and final profile files. If a new run fails, the previous active dataset remains available to the backend and frontend. In the documented execution, the active dataset contains 480 profiles, with 397 profiles inferred as male and 83 inferred as female for aggregate visualization purposes.

#### 3.3.3 Final Dataset and Storage Contract

The final dataset is stored as CSV and JSON. CSV is useful for inspection, spreadsheet use and export. JSON is used by the backend because it preserves nested fields such as topics, areas, links, summaries, quality notes and profile metadata. The active dataset is not discovered by scanning folders; it is selected through `scrape_results/current.json`, which acts as the contract between the pipeline and the application layer.

Each researcher profile contains base fields and semantic fields. The base fields include name, institution, scholarship level, Lattes code, Lattes name, Lattes URL, photo URL and summary. These fields are either extracted from the CNPq table or from the Lattes preview and full curriculum stages. The rule-derived fields include institution state, institution region, scholarship category, scholarship rank, doctorate year, years since doctorate, profile language and inferred sex. These fields are computed locally whenever possible and may be validated or corrected by LLMs when the evidence is textual or ambiguous.

The LLM-generated or LLM-validated fields include main research area, secondary research areas, research topics, methods and techniques, application domains, career stage, academic rank, seniority level, international experience, industry experience, management experience, editorial or event experience, patents or software outputs, output focus, short profile summaries, search keywords, dashboard tags, data quality notes and QA context.

> **Figure placeholder 4 - Dataset artifact structure.**  
> Insert a screenshot or diagram showing `current.json`, `profiles_with_inferences.json`, `profiles_search_corpus.json` and `minimal_profiles_context.json`.

#### 3.3.4 Search Corpus, Vector Store and Minimal Context

After the final dataset is promoted, the `search_context_agent` prepares the artifacts used by natural language querying and semantic search. This stage does not recollect data. It transforms the enriched dataset into context formats optimized for different tasks.

The first artifact is `profiles_search_corpus.json`. It contains a richer semantic representation of the profiles and is designed for open-ended search questions. It includes identifying fields, institution and scholarship data, semantic areas, topics, methods, summaries and text useful for retrieval. This corpus can be uploaded once to OpenAI and indexed in a Vector Store. In that configuration, File Search provides the retrieval component of the RAG flow: relevant passages are retrieved from the indexed corpus and then passed to the answer agent. The system does not use Vector Store as the source for exact totals, because retrieval can return only a subset of relevant records.

The second artifact is `minimal_profiles_context.json`, also exported as a text-friendly context file. This minimal context contains one compact entry per person, including full name, first name, inferred sex, institution, scholarship level, scholarship category, state and region. It is intentionally smaller than the complete profile dataset and can be sent to the planner and answer agents as a general reference. It helps answer simple profile-level questions without sending the entire 5 MB enriched dataset in every request.

This separation creates three levels of context. The local JSON dataset is used for exact structured operations. The minimal context is used as a cheap global overview. The Vector Store corpus is used for semantic retrieval when the question requires richer textual evidence.

#### 3.3.5 Natural Language Chat Implementation

The chat implements the natural language requirement through a multi-agent flow. The first agent is the `query_planner_agent`, which uses `gpt-5.4-mini`. It receives the user question, the available tool descriptions, the dataset structure, dashboard metrics and the minimal profile context. Its responsibility is to decide how the question should be answered, not to produce the final answer. It returns a structured plan indicating whether the backend should use local structured query, topic candidate search, dashboard metrics, File Search over the Vector Store or a combination of these tools.

The plan is executed by deterministic `backend_tools`. These tools can count records, filter by fields, rank groups, search candidate profiles by topic and retrieve dashboard metrics. They can also request File Search when the planner decides that semantic retrieval from the uploaded corpus is useful. The planner cannot execute arbitrary code; it can only request supported tools with supported parameters.

The selected evidence is then handed to the `query_answer_agent`, which also uses `gpt-5.4-mini`. This agent receives the original question, recent conversation history and the compact context package generated by the backend tools. Its role is to validate the evidence, explain the result and avoid presenting unsupported claims as facts. For exact questions, such as "How many researchers are from USP?", the answer should be grounded in structured query results. For semantic questions, such as "Who works with mobile robotics?", the answer can use topic candidates and retrieved evidence, with explicit caution when the evidence is ambiguous.

The chat also uses a `chat_title_agent` with `gpt-5.4-nano`. This agent generates short titles for new conversations so that the frontend can list chat sessions in a user-friendly way. Chat sessions and messages are stored locally as JSON files, which is sufficient for the project demonstration and keeps the state easy to inspect.

#### 3.3.6 Dashboard Metrics

The dashboard is served by the `/dashboard/metrics` route. The backend calculates metrics before sending them to the frontend, so the browser does not need to load the full dataset to render charts. This design reduces frontend complexity and also makes the same metrics available to the chat agents as structured context.

The `dashboard_agent` computes metrics over the active JSON dataset. The dashboard supports general cards, scholarship distributions, regional distributions, state rankings, inferred sex distribution, doctorate year ranges, concentration by institution, area by scholarship level, region by scholarship level and inferred sex by scholarship level. These charts were selected because they answer questions that are relevant to scholarship evaluation and project planning. For example, the dashboard can support analysis of geographic concentration, institutional concentration, diversity patterns and distribution of research areas across scholarship levels.

> **Figure placeholder 5 - Dashboard screen.**  
> Insert a screenshot of the dashboard with the main cards and charts.

#### 3.3.7 Profile Search and Export

The profile search feature is implemented by the `profile_search_agent` and exposed through the `/profiles` routes. It allows users to browse individual researchers, list profiles with photos, search by name, institution, area, topic or text, filter by institution, scholarship, inferred sex and region, open the Lattes URL and export selected data as CSV.

The search normalizes accents, underscores and common topic variants. For example, `integer programming` can match `integer_programming`, and Portuguese/English variants such as `robotica` and `robotics` can be treated as related. This is important because semantic fields may be generated in normalized English labels, while users may search using natural terms in Portuguese or English.

> **Figure placeholder 6 - Researcher search screen.**  
> Insert a screenshot of the profile list with filters, photos and pagination.

#### 3.3.8 Frontend Consumption Layer

The frontend is implemented in Next/React. In the architecture, it is intentionally a consumption layer: it does not run scraping, does not compute the official metrics and does not perform LLM reasoning. It consumes the FastAPI routes and renders the user interface for login, navigation, dashboard, profile search and chat.

This separation keeps the frontend simpler and makes the backend the single source of truth for the active dataset. The dashboard consumes `/dashboard/metrics`, the researcher page consumes `/profiles`, and the chat consumes the session and message routes. The frontend also renders markdown-style chat answers, chat loading states, profile photos, filters, pagination and CSV export actions.

#### 3.3.9 Logs, Review Artifacts and Auditability

The pipeline is implemented as an orchestrated sequence of deterministic processes and agent-supported decision points. Once triggered, deterministic scrapers perform factual collection and curriculum extraction, while agents are used where decisions are required: ambiguous Lattes matches, invalid inference outputs, low-confidence fields, query planning and answer validation. Logs and artifacts are generated for each important step so that these decisions remain auditable. The main artifacts include pipeline logs, stage summaries, retry logs, LLM review files, inference logs, review queues, normalization logs, sex review logs and chat session files. Instead of a single monolithic log, each stage produces artifacts relevant to its responsibility.

The most important files are:

```txt
logs/pipeline_<timestamp>.log
summary.json per stage
retry_log.json
llm_review.json
inference_llm.json
review_queue.csv/json
sex_unknown_review_log.json
normalization_log.json
scrape_results/chat/sessions/*.json
```

#### 3.3.10 ADRs

The project includes ADRs to justify design decisions. They are stored in the project repository and are available at: [https://github.com/DavidD344/agentic-api/tree/master/ADR](https://github.com/DavidD344/agentic-api/tree/master/ADR). The most important decisions are the use of deterministic scraping instead of LLM agents for factual collection, local CSV/JSON storage for auditability and export, staged scraping, LLM usage only for ambiguity and semantic tasks, structured backend tools for exact counts, optional Vector Store for semantic retrieval, backend-computed dashboard metrics and conventional APIs instead of a dedicated MCP server for this version.

#### 3.3.11 Testing and Validation

The project was validated incrementally. Instead of building the complete pipeline at once, each stage was tested separately with small samples and then with the full dataset. The CNPq scraper was first tested by inspecting the generated tables and verifying that the correct scholarship table was extracted. The Lattes preview stage was tested for one researcher, then for subsets, and finally for all 480 researchers. Review queues were inspected for not found cases, ambiguous matches and technical errors, and retry logic was added for technical failures.

The Lattes full stage was tested on individual profiles before batch execution. The raw HTML, raw text and structured JSON artifacts were inspected to confirm that the curriculum content was available for inference. The inference stage was first tested on three profiles before being executed on the full dataset. The Inference Repair Agent was added to handle invalid LLM outputs, and normalization scripts were used to correct region, UF and inferred sex values after inspecting the generated data.

The dashboard metrics were validated against the active JSON files, and the chat was tested with exact count questions, topic search questions and composed questions. The frontend screens were manually tested through the browser. The active run summary also acts as a validation artifact: the documented execution processed 480 profiles, matched 480 Lattes previews, matched 480 full curricula, ended with zero final LLM errors and had eight invalid inference outputs successfully repaired by the Inference Repair Agent.

The system does not claim that all inferred fields are perfect. Instead, it records confidence, review flags and logs. This is part of the validation strategy: uncertain semantic fields are made visible instead of silently accepted.

#### 3.3.12 Deployment

The project was designed primarily for local execution and classroom demonstration. The backend runs with Uvicorn/FastAPI and the frontend runs with Next. For external demonstration, ngrok can expose the local backend or frontend, but the main stable development mode is local.

The deployment strategy for the current version uses a local FastAPI server, a local Next development server, local CSV/JSON files under `scrape_results` and an OpenAI API key configured through environment variables. This approach was chosen because the project depends on locally generated artifacts and because the main evaluation is the architecture and functionality, not cloud infrastructure.

---

## 4. Lessons Learned

The most successful decision was separating factual extraction from semantic reasoning. CNPq and Lattes scraping produce concrete artifacts, while LLMs are used only where interpretation is needed. This made the system easier to debug, easier to explain and easier to defend academically. The project also benefited from treating agents as responsibilities with handoffs, rather than treating every agent as a language model. This made it possible to combine deterministic scrapers, backend services and LLM calls in a single multi-agent architecture.

The staged pipeline was another strong design choice. Each stage can be executed, inspected and repeated independently, which reduced development risk. If Lattes full extraction or inference failed, the CNPq extraction and preview matching artifacts were still preserved. The active dataset manifest was also important. The `current.json` file makes it possible to keep multiple runs while exposing only the last valid base to the API and frontend. This model is simple, but it provides a clear boundary between experimental runs and the dataset currently used by the application.

The chat architecture also produced an important lesson. A single LLM call is not reliable enough for structured analysis over a dataset, especially when the user asks for counts, rankings or filtered groups. The planner-tool-answer flow improved reliability because the planner chooses tools, the backend computes data and the answer agent explains the result. This is more defensible than asking a single LLM to answer from memory or from a large prompt.

The project also revealed limitations. Scraping depends on external page structures, so changes in the CNPq or Lattes HTML may require parser updates. The chat can also become expensive because a normal question may use two model calls: one for planning and one for answering. This was accepted for quality during the presentation, but a cheaper mode could be implemented later.

Another limitation is that the current semantic inference is useful, but not complete. The system already extracts areas, topics, methods, experience indicators and profile summaries, but future versions should add more inferences, especially over the publications listed in the Lattes curriculum. Article titles, venues, coauthors and publication years could support better analysis of research production, collaboration networks, recent activity and topic evolution. The current version focuses more on profile-level inference than on publication-level bibliometric analysis.

The natural language toolset could also be expanded. The current chat uses structured query tools, dashboard metrics, topic candidate search, minimal context and optional Vector Store/File Search. A future version should add a dedicated Full CV Tool, allowing the answer agent to inspect the full curriculum artifact of a selected researcher when the user asks detailed questions about one person. This would complement the existing query tool, which is better for aggregate questions and filtered lists.

Future work includes integrating Google Scholar as an external enrichment source, adding more publication-level inferences, moving local CSV/JSON storage to a relational database, adding background jobs for pipeline execution, creating a production-grade authentication system, adding centralized observability, reducing chat cost with adaptive context selection, improving semantic search with local embeddings, expanding human review screens and implementing MCP if external tool integration becomes necessary.

---

## 5. Conclusion

Agentic API implements a complete multi-agent workflow for collecting, enriching, visualizing and querying CNPq productivity scholarship data in Computer Science. The system starts from a public CNPq table, extracts scholarship data deterministically, matches researchers with Lattes profiles, downloads full curricula, generates semantic fields and exposes the final dataset through dashboard, profile search and natural language chat.

The project uses a hybrid architecture. Scrapers are responsible for factual data collection, deterministic services are responsible for counts and metrics, and LLM agents are responsible for semantic decisions such as ambiguity resolution, inference generation and natural language answers. This separation makes the system more auditable and more reliable than a pure LLM-based approach.

The final implementation covers the assignment requirements: dataset generation, dashboard, export, natural language querying and agent-supported reduction of manual intervention. It also documents the design through ADRs, agent descriptions, handoffs, tools, guardrails and observable execution artifacts. Although there are limitations related to scraping fragility and LLM cost, the system provides a functional and defensible foundation for research data analysis.

---

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

[11] Project ADRs, documentation and source code in the `agentic-api` repository: [https://github.com/DavidD344/agentic-api/tree/master/ADR](https://github.com/DavidD344/agentic-api/tree/master/ADR).

> **Note for final submission.**  
> Before delivering the report, format these references according to the required academic style and add complete publication metadata where available.

---

## 7. Appendix - Replication Package

### 7.1 Repository Structure

```txt
app/
  main.py
  routers/
  services/
  scrapers/

frontend/
  Next/React application

scrape_results/
  generated runs, final dataset, search corpus and active manifest

logs/
  pipeline logs

ADR/
  Architecture Decision Records

docs/
  system documentation, agent summaries, API routes and flow descriptions
```

### 7.2 Environment

Backend dependencies are managed with `uv` and defined in `pyproject.toml`. The project uses Python 3.14, FastAPI, Playwright, BeautifulSoup and OpenAI SDK.

Frontend dependencies are managed with `npm` and defined in `frontend/package.json`. The frontend uses Next 15, React 19, Axios, React Query and Tailwind-related utilities.

### 7.3 Running the Backend

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run uvicorn app.main:app --reload
```

If port 8000 is already in use:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run uvicorn app.main:app --reload --port 8001
```

### 7.4 Running the Frontend

```bash
cd frontend
npm run dev
```

The frontend should point to the backend URL configured in its environment file.

### 7.5 Demo Login

```txt
email: admin@admin.com
password: admin
```

This authentication is only for demonstration and should not be used as production security.

### 7.6 Running the Full Pipeline

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/pipeline_scrape.py
```

For a limited test run:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/pipeline_scrape.py 10
```

Limited runs do not promote `current.json`.

### 7.7 Important Output Files

```txt
scrape_results/current.json
scrape_results/<run>/scholarships.csv
scrape_results/lattes_preview/<run>/lattes_profiles.csv
scrape_results/lattes_full/<run>/lattes_full_profiles.json
scrape_results/inferences/<run>/profiles_with_inferences.json
scrape_results/search/profiles_search_corpus.json
scrape_results/search/minimal_profiles_context.json
logs/pipeline_<run>.log
```

### 7.8 Useful API Checks

Health check:

```http
GET /
```

Dashboard:

```http
GET /dashboard/metrics
```

Profiles:

```http
GET /profiles
```

Pipeline status:

```http
GET /admin/pipeline/status
```

### 7.9 Suggested Images to Add Later

1. General system flowchart from `fluxograma.pdf`.
2. Pipeline-only diagram from CNPq to final dataset.
3. Screenshot of `current.json` or active dataset manifest.
4. Dashboard screenshot.
5. Profile search screenshot.
6. Chat screenshot with a question and answer.
7. Folder structure showing `scrape_results` and logs.

### 7.10 Current Active Run Summary

```txt
active dataset updated at: 2026-05-26T21:47:14
total profiles: 480
Lattes preview matched: 480
Lattes full matched: 480
final LLM errors: 0
inference repair attempts: 8
inference repair successes: 8
```

This summary represents the active dataset used during development and presentation preparation.
