# ADR 0016: Google Scholar as optional enrichment

Status: accepted

## Motivating Requirement

RF01 mentions Google Scholar as a desired field in the dataset. The initial document planned a `scholarResearch_agent` with three possible outcomes:

```txt
profile found with high confidence
profile found but questionable
no profile found
```

## Architectural Problem

Google Scholar is useful, but has obstacles:

- anti-scraping blocks;
- homonyms;
- missing profiles;
- incorrect association by name;
- difficulty ensuring current institution;
- risk of delaying the main pipeline.

## Decision

We will keep `scholarResearch_agent` as a conceptual agent and exploratory script, but not as a mandatory stage of the MVP.

The main pipeline remains:

```txt
CNPq -> Lattes preview -> full Lattes -> inferences -> dashboard/chat
```

Scholar becomes future or optional enrichment.

## Rationale

For delivery, it is better to have a reliable main dataset than to add a source with high false-positive risk.

Lattes already covers:

- curriculum URL;
- education;
- research area;
- summary;
- experience;
- academic outputs and sections.

Scholar would add bibliometric metrics, but does not replace Lattes.

## Planned Future Behavior

```txt
orchestrator_agent -- name + institution + area --> scholarResearch_agent
scholarResearch_agent -- matched/questionable/not_found --> orchestrator_agent
```

If enabled, the agent should save:

```txt
google_scholar_url
scholar_match_status
scholar_candidates
scholar_metrics
```

## Future Guardrails

- Never promote a questionable result as certain.
- Save candidates for review.
- Use name, institution and area.
- Differentiate `not_found` from technical error.
- Do not block the main pipeline due to Scholar failure.

## Consequences

Advantages:

- more stable main pipeline;
- lower risk of wrong profile;
- focus on more defensible sources;
- architecture remains prepared for Scholar.

Limitations:

- Scholar field may be missing;
- dashboard does not use h-index/citations;
- questions about citations depend on future evolution.

## Notes

Author: project team.

Date: 2026-06-02.

Exploratory file:

- `app/scrapers/scholar_scrape.py`
