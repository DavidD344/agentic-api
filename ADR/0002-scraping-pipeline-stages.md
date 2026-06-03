# ADR 0002: Staged scraping pipeline

Status: accepted

## Motivating Requirement

RF01 requires generating a dataset with fields from different sources:

```txt
name, institution, scholarship level -> CNPq page
state, area, doctorate year, URL     -> Lattes / inferences
Google Scholar                       -> optional enrichment
sex                                  -> inference
```

The initial document also defined handoffs between `orchestrator_agent`, `collector_agent`, `lattesResearch_agent`, `scholarResearch_agent` and `genderGuesser_agent`.

## Architectural Problem

A single scraping stage would be hard to test, debug and review. The sources have different characteristics:

- CNPq is a structured table;
- Lattes preview requires search and disambiguation;
- full Lattes is heavier and more failure-prone;
- inferences require semantic reasoning.

## Decision

We will split collection into a staged pipeline:

```txt
CNPq scholarships
-> Lattes preview
-> full Lattes
-> inferences
-> normalizations
-> unknown sex review
-> promotion to current.json
-> corpus/context generation
```

The `orchestrator_agent` coordinates these stages.

## Rationale

Splitting stages allows us to:

- test with a small number of people;
- rerun only the problematic stage;
- review ambiguities before downloading full curricula;
- preserve evidence;
- explain handoffs between agents.

## Resulting Behavior

Full command:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/pipeline_scrape.py
```

Limited command:

```bash
env UV_CACHE_DIR=/tmp/uv-cache uv run python app/scrapers/pipeline_scrape.py 10
```

Limited runs are tests and do not become the active base.

## Handoffs

```txt
orchestrator_agent -- CNPq URL --> collector_agent
collector_agent -- scholarships.csv --> lattes_preview_agent
lattes_preview_agent -- lattes_profiles.csv --> lattes_full_agent
lattes_full_agent -- lattes_full_profiles.json --> inference_agent
inference_agent -- profiles_with_inferences.json --> normalization_agent
normalization_agent -- normalized base --> search_context_agent
search_context_agent -- current.json/corpus --> dashboard_agent/query_agent
```

## Tools

- Playwright/Chromium for dynamic pages;
- BeautifulSoup for HTML parsing;
- CSV/JSON for storage;
- OpenAI only in ambiguity/inference stages.

## Guardrails

- `review_queue_full` blocks automatic promotion.
- `technical_error` can be retried.
- Limited runs do not promote `current.json`.
- Each stage produces a `summary.json`.

## Consequences

Advantages:

- higher auditability;
- better failure isolation;
- enables manual or agent-based review;
- makes the flow easier to present.

Limitations:

- more files;
- more documentation;
- pipeline is slower than a single collection step;
- contracts between stages must be maintained.

## Notes

Author: project team.

Date: 2026-06-02.

Related:

- ADR 0008
- ADR 0009
- ADR 0011
- ADR 0012
