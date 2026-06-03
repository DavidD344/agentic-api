# ADR 0003: Chat with File Search and structured queries

Status: accepted

## Motivating Requirement

RF04 requires an interface for querying information in natural language.

The initial document defines a `query_agent` responsible for natural language queries. This agent must answer both open-ended and quantitative questions.

## Architectural Problem

The professor's questions may be of two types:

```txt
quantitative:
  "how many people are from USP?"
  "how many PQ-1 women are in the Southeast?"

semantic:
  "who works with robotics?"
  "who could be on a committee about AI and health?"
```

Sending the whole file to the LLM on every question is expensive and can exceed the context window. Using only File Search is good for retrieving passages, but poor for exact global counts.

## Decision

We will use a hybrid architecture:

```txt
quantitative questions -> local structured query over the active JSON
semantic questions     -> File Search / Vector Store or local search + validation
final answer           -> answer/validation LLM
```

## Rationale

Counts must be deterministic. Topics and recommendations require semantic interpretation.

Separating these two capabilities avoids the failure observed during tests: with File Search, the LLM retrieved a few examples and answered as if they were the total.

## Resulting Behavior

The backend keeps:

```txt
profiles_with_inferences.json  -> structured base for counts/filters
profiles_search_corpus.json    -> compact corpus for semantic search
vector_store.json              -> File Search metadata
```

The `query_planner_agent` chooses the tool. The backend executes it. The `query_answer_agent` receives the results and writes the answer.

## Handoffs

```txt
user
  -> query_planner_agent
  -> structured_query or file_search
  -> query_answer_agent
  -> user
```

## Guardrails

- The LLM does not calculate global counts when the backend can calculate them.
- The full corpus is not resent for every question.
- File Search is an auxiliary tool, not the single source of truth.
- The `vector_store_id` must be synchronized when the base changes.

## Consequences

Advantages:

- lower cost;
- more reliable counts;
- support for semantic questions;
- clearer multi-agent architecture.

Limitations:

- requires question routing;
- mixed questions are more complex;
- File Search may retrieve insufficient passages;
- Vector Store synchronization is an operational responsibility.

## Notes

Author: project team.

Date: 2026-06-02.

Related:

- ADR 0004
- ADR 0005
- ADR 0012
- ADR 0014
