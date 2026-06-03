# ADR 0009: CNPq and Lattes scraping strategy driven by RF01

Status: accepted

## Motivating Requirement

RF01 requires generating a dataset with:

```txt
name
sex
institution
state
scholarship level
research area
doctorate completion year
URL
Google Scholar
```

The initial document already separated data origins:

```txt
name, institution, scholarship level -> CNPq link
doctorate year, area, URL           -> Lattes
Google Scholar                      -> Scholar
sex                                 -> inference
```

## Architectural Problem

The CNPq page alone does not contain every field. Lattes must be queried, but searching a curriculum by name may create ambiguity.

In addition, the scraping process must be auditable because the final dataset mixes official sources, scraping and inference.

## Decision

We will use three main collection stages:

```txt
collector_agent
  collects CNPq

lattes_preview_agent
  searches name + institution in Lattes and resolves lattes_code

lattes_full_agent
  downloads full curriculum by lattes_code
```

Google Scholar is addressed in a separate ADR as optional enrichment.

## Rationale

CNPq is the official source for the scholarship. Lattes is the most appropriate source for curriculum and URL. Separating preview from full curriculum reduces the risk of associating the wrong curriculum.

Saving HTML/TXT/JSON in each stage creates evidence to explain where each data point came from.

## Resulting Behavior

`collector_agent` saves:

```txt
scholarships.csv
scholarships.json
page.html
table_*.csv
summary.json
```

`lattes_preview_agent` saves:

```txt
lattes_profiles.csv/json
review_queue.csv/json
llm_review.json
retry_log.json
summary.json
```

`lattes_full_agent` saves:

```txt
lattes_full_profiles.csv/json
raw/<person>/full_cv.html
raw/<person>/full_cv.txt
raw/<person>/full_profile.json
summary.json
```

## Handoffs

```txt
orchestrator_agent -- CNPq URL --> collector_agent
collector_agent -- name + institution --> lattes_preview_agent
lattes_preview_agent -- lattes_code --> lattes_full_agent
lattes_full_agent -- full curriculum --> inference_agent
```

## Tools

- Playwright/Chromium for navigation;
- BeautifulSoup for parsing;
- CSV/JSON for artifacts;
- technical retry for temporary failures.

## Guardrails

- Do not download full curriculum for an ambiguous candidate.
- Traverse Lattes result pagination.
- Retry technical errors at the end of the stage.
- Keep a review queue for uncertain cases.
- Do not require the scholarship to appear in Lattes, because CNPq is the scholarship source.

## Consequences

Advantages:

- satisfies RF01 with appropriate sources;
- reduces false matches;
- enables auditability;
- preserves raw data;
- supports human or agent-based review.

Limitations:

- scraping is slow;
- Lattes may change HTML;
- some curricula may fail;
- Scholar remains optional enrichment.

## Notes

Author: project team.

Date: 2026-06-02.

Main files:

- `app/scrapers/simple_scrape.py`
- `app/scrapers/lattes_scrape.py`
