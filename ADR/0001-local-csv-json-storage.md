# ADR 0001: Local CSV/JSON storage for the MVP

Status: accepted

## Motivating Requirement

RF01 requires generating a dataset with scholarship holder data. RF03 requires exporting information. RF05 requires logs of system operations.

The initial project document also stated that every agent should record its outputs and that the process should be explainable during the presentation.

## Architectural Problem

We had to decide where to store:

- raw scraping data;
- intermediate data;
- final dataset;
- review queues;
- logs;
- chat sessions.

The options were:

- relational database from the beginning;
- local file storage;
- in-memory only storage;
- manual spreadsheets.

## Decision

We will use local CSV/JSON files under `scrape_results/` as the main storage mechanism for the MVP.

The file `scrape_results/current.json` points to the active data version.

## Rationale

For an academic MVP, CSV/JSON better supports transparency:

- the professor can open the files;
- the team can audit each stage;
- data can be exported easily;
- the pipeline can preserve previous runs;
- logs and artifacts stay close to the execution.

A relational database would be better for production, but it would add complexity before validating scraping, inference and dashboard behavior.

## Resulting Behavior

Each agent writes its outputs to timestamped folders:

```txt
collector_agent      -> scrape_results/<cnpq_run>/
lattes_preview_agent -> scrape_results/lattes_preview/<run>/
lattes_full_agent    -> scrape_results/lattes_full/<run>/
inference_agent      -> scrape_results/inferences/<run>/
orchestrator_agent   -> scrape_results/current.json
query_agent          -> scrape_results/chat/sessions/
```

The dashboard, profile search and chat do not look for the latest folder. They read `current.json`, which points to the latest valid base.

## Handoffs

```txt
scholarships.csv
  -> lattes_preview_agent

lattes_profiles.csv/json
  -> lattes_full_agent

lattes_full_profiles.json
  -> inference_agent

profiles_with_inferences.json
  -> dashboard_agent
  -> profile_search_agent
  -> query_agent
```

## Guardrails

- Limited runs do not replace `current.json`.
- Runs with critical errors do not promote the active base.
- Raw files are preserved for auditability.
- CSV is used for human inspection; JSON is used for structured consumption.

## Consequences

Advantages:

- easy manual inspection;
- simple export;
- clear explanation in slides;
- per-stage reprocessing;
- low infrastructure cost.

Limitations:

- not ideal for multiple users in production;
- limited write concurrency;
- very complex queries would be better served by a database;
- history depends on the local filesystem.

## Notes

Author: project team.

Date: 2026-06-02.

Related:

- ADR 0002
- ADR 0012
- ADR 0013
