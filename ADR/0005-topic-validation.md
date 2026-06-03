# ADR 0005: Semantic topic validation by the final LLM

Status: accepted

## Motivating Requirement

RF04 requires natural language queries. The professor may ask about topics, not only exact fields:

```txt
who works with robotics?
who works with electronics?
who researches AI applied to health?
```

## Architectural Problem

Simple text search creates false positives. A term may appear in:

- main area;
- research topic;
- project title;
- old training;
- event;
- incidental expression.

Example:

```txt
"electronics" may mean an electronics research area
or appear in "electronic voting"
```

## Decision

We will treat topic search as candidate search, not as the final answer.

When the backend uses a topic filter, the `query_answer_agent` receives the candidates and semantically validates which ones actually belong to the requested topic.

## Rationale

The natural language requirement needs interpretation. Counting text occurrences is not enough for analytical answers.

The final LLM can evaluate:

- profile summary;
- main area;
- inferred topics;
- methods;
- application domain;
- question context.

## Resulting Behavior

```txt
topic question
  -> query_planner_agent chooses topic search
  -> backend returns broad candidates
  -> query_answer_agent validates candidates
  -> answer reports validated count and criteria
```

## Guardrails

- Old training does not count as current work unless explicitly requested.
- Incidental mentions do not count as the topic.
- The agent must explain when the search is semantic and may involve uncertainty.
- Large candidate sets are limited by `CHAT_TOPIC_VALIDATION_LIMIT`.

## Consequences

Advantages:

- reduces false positives;
- improves thematic answers;
- allows explaining inclusion/exclusion criteria;
- makes chat closer to real dataset analysis.

Limitations:

- thematic counts depend on LLM judgment;
- results may vary in ambiguous cases;
- truncated candidates may limit coverage;
- thematic queries cost more.

## Notes

Author: project team.

Date: 2026-06-02.

Related:

- ADR 0003
- ADR 0004
- ADR 0014
