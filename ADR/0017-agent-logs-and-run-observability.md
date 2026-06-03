# ADR 0017: Agent logs and run observability

Status: accepted

## Motivating Requirement

RF05 requires generating a log of all operations performed by the system.

The initial document also states:

```txt
All agents will record their logs
```

## Architectural Problem

The pipeline involves scraping, Lattes, inferences, normalization, base promotion and chat. Without logs, it would be hard to explain:

- which stage failed;
- which data was generated;
- whether the LLM was called;
- whether a run was promoted;
- why a case went to review.

## Decision

We will record logs and artifacts per execution, combining:

```txt
logs/pipeline_<run>.log
summary.json per stage
retry_log.json
llm_review.json
inference_llm.json
review_queue.csv/json
sex_unknown_review_log.json
normalization_log.json
scrape_results/chat/sessions/*.json
```

## Rationale

Text logs help monitor execution in real time. Summary and review JSON files help audit decisions afterwards.

This combination satisfies the requirement better than a single large log, because each agent records its own artifacts.

## Resulting Behavior

```txt
orchestrator_agent
  -> logs/pipeline_<timestamp>.log
  -> pipeline_summary.json

lattes_preview_agent
  -> retry_log.json
  -> llm_review.json
  -> review_queue.json

inference_agent
  -> inference_llm.json
  -> summary.json

normalization_agent
  -> normalization_log.json

sex_review_agent
  -> sex_unknown_review_log.json

query_agent
  -> scrape_results/chat/sessions/<id>.json
```

## Guardrails

- Logs do not replace data artifacts.
- Failed runs remain recorded.
- The previous active base stays active if the new one fails.
- LLM decisions save confidence/reason when applicable.

## Consequences

Advantages:

- satisfies RF05;
- helps debugging;
- supports pipeline explanation in the presentation;
- provides traceability for inferences;
- helps reviewing ambiguities.

Limitations:

- more files;
- local logs are not centralized;
- no full production observability dashboard;
- log cleanup is manual or future work.

## Notes

Author: project team.

Date: 2026-06-02.

Related:

- ADR 0001
- ADR 0002
- ADR 0008
- ADR 0011
