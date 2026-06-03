# ADR 0010: LLM as reviewer for Lattes ambiguity

Status: accepted

## Motivating Requirement

RF01 requires correctly associating each scholarship holder with their Lattes curriculum in order to extract URL, area and doctorate year.

The initial document planned that the `lattesResearch_agent` would search curriculum by name + institution. This creates a decision: how should the system handle more than one returned person?

## Architectural Problem

Academic names may be ambiguous. Text equality rules do not solve every case:

- institutions may appear abbreviated;
- a person may have changed institution;
- Lattes may return homonyms;
- summary and links may be relevant evidence.

## Decision

We will use an LLM only for ambiguous cases in the `lattes_preview_agent`.

Flow:

```txt
collect candidates
-> apply local rules
-> separate ambiguous cases
-> LLM reviews candidates
-> accept if confidence >= 0.85
-> keep review_queue if uncertain
```

Configuration:

```txt
LATTES_LLM_MODEL=gpt-5.4-mini
LATTES_DISABLE_LLM=1
```

## Rationale

The LLM can make contextual comparisons between:

- expected name;
- expected institution;
- area/summary;
- external links;
- available candidates.

But it does not create new data. It only chooses among candidates already collected.

## Resulting Behavior

The prompt states:

- CNPq scholarship is auxiliary context;
- absence of scholarship in Lattes does not invalidate a candidate;
- compatible name + institution + area may resolve the match;
- real uncertainty must return `ambiguous`;
- the answer must be JSON.

Results are saved in:

```txt
llm_review.json
review_queue.csv/json
```

## Handoffs

```txt
lattes_preview_agent -- ambiguous candidates --> LLM reviewer
LLM reviewer -- matched/ambiguous + confidence --> lattes_preview_agent
```

## Guardrails

- The LLM only chooses existing candidates.
- Low confidence does not promote a match.
- Justification and confidence are recorded.
- Uncertain cases remain reviewable.

## Consequences

Advantages:

- reduces manual review;
- improves difficult matches;
- keeps traceability;
- can be disabled by environment variable.

Limitations:

- adds cost;
- depends on an OpenAI key;
- may fail on subtle cases;
- does not replace human review when evidence is weak.

## Notes

Author: project team.

Date: 2026-06-02.

Main file:

- `app/scrapers/lattes_scrape.py`
