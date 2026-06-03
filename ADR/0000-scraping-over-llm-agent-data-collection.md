# ADR 0000: Use deterministic scraping instead of LLM agents for primary data collection

Status: accepted

## Motivating Requirement

RF01 requires generating a dataset with scholarship holder information based on the CNPq page and complementary public sources.

The system must produce data that can be audited, exported and defended during the presentation:

```txt
name
sex
institution
state
scholarship level
research area
doctorate completion year
URL
Google Scholar when possible
```

## Architectural Problem

We had to decide how the system should obtain factual information from public sources.

Two main options were considered:

```txt
Option A:
  ask an LLM/agent to visit or reason about the source and return the dataset

Option B:
  use deterministic scraping to extract source data,
  then use agents/LLMs only for ambiguous or semantic decisions
```

Using a pure LLM agent for primary collection would be risky because:

- it may hallucinate missing fields;
- it may summarize instead of preserving rows;
- it may miss records;
- it is hard to audit exact extraction;
- it is hard to reproduce the same result;
- it is expensive to process full pages repeatedly;
- it does not create good intermediate artifacts for review.

## Decision

We will use deterministic scraping as the primary data collection mechanism.

LLM agents will not be responsible for collecting the official dataset directly. They will only be used after scraping, in controlled points where semantic judgment is useful:

```txt
1. resolving ambiguous Lattes candidates
2. generating/validating semantic inferences
3. reviewing unknown inferred sex
4. planning natural language queries
5. validating/writing chat answers
6. generating chat titles
```

## Rationale

The CNPq page is a structured source. A scraper can extract the table row by row and preserve the original data. This is more reliable than asking an LLM to reconstruct the table.

The Lattes source also benefits from scraping because we need concrete artifacts:

```txt
candidate list
lattes_code
preview data
full curriculum HTML
full curriculum text
structured JSON
review queues
```

Agents and LLMs are still part of the architecture, but they are used where they add value: ambiguity resolution, semantic interpretation and natural language interaction.

## Resulting Behavior

The system separates factual collection from semantic reasoning:

```txt
factual extraction:
  CNPq scraper
  Lattes preview scraper
  Lattes full scraper

semantic/agentic decisions:
  Lattes ambiguity review
  inference generation
  unknown sex review
  chat planning
  chat answer validation
```

This produces an auditable pipeline:

```txt
CNPq table
  -> scraping
  -> scholarships.csv/json
  -> Lattes scraping
  -> lattes_profiles.csv/json
  -> full curriculum scraping
  -> lattes_full_profiles.csv/json
  -> LLM-assisted inferences
  -> final dataset
```

## Handoffs

```txt
collector_scraper
  -> extracts CNPq rows
  -> hands scholarships.csv to lattes_preview_agent

lattes_preview_scraper
  -> extracts Lattes candidates
  -> hands ambiguous cases to LLM reviewer only when needed

lattes_full_scraper
  -> extracts full curriculum artifacts
  -> hands structured data to inference_agent

inference_agent
  -> uses LLM for semantic fields
  -> hands enriched dataset to dashboard/chat agents
```

## Tools

Deterministic collection tools:

- Playwright/Chromium;
- BeautifulSoup;
- CSV/JSON writers;
- local filesystem artifacts.

LLM tools used after collection:

- OpenAI Responses API;
- File Search / Vector Store for semantic retrieval;
- controlled JSON prompts;
- backend structured query tools.

## Guardrails

- LLM does not replace CNPq as the official scholarship source.
- LLM does not invent Lattes candidates.
- LLM only chooses among candidates already scraped.
- Counts are calculated from local JSON, not from LLM memory.
- Raw HTML/TXT/JSON artifacts are saved for audit.
- Runs with errors do not promote `current.json`.

## Consequences

Advantages:

- more reproducible data collection;
- stronger audit trail;
- lower hallucination risk;
- easier debugging;
- easier defense during presentation;
- LLM cost is limited to high-value semantic tasks.

Limitations:

- scraping is slower to implement than a single prompt;
- source HTML changes may break parsers;
- browser automation can be fragile;
- semantic enrichment still requires LLM calls after scraping.

## Notes

Author: project team.

Date: 2026-06-02.

This ADR is the main architectural decision of the data pipeline. The following ADRs detail how storage, staged scraping, Lattes ambiguity, inference, dashboard and chat are implemented from this decision.

Related:

- ADR 0001
- ADR 0002
- ADR 0008
- ADR 0009
- ADR 0010
- ADR 0011
- ADR 0014
