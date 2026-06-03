# ADR 0014: Query agent with planning, tools and answer validation

Status: accepted

## Motivating Requirement

RF04 requires a natural language query interface. The initial document defined a `query_agent`, but also required reasoning, planning, tools and guardrails.

## Architectural Problem

A pure LLM chat may sound convincing while being wrong. In our domain, common errors would be:

- inventing counts;
- counting only retrieved examples;
- confusing incidental mentions with research area;
- ignoring composed filters;
- not explaining uncertainty.

## Decision

We will implement the `query_agent` as a collaboration between:

```txt
query_planner_agent
backend tools
context_package
query_answer_agent
```

The planner decides which data and tools are needed. The backend executes the tools and builds a context package. The answer agent receives that package, validates and answers.

## Rationale

This decision turns chat into a real agentic architecture:

- reasoning/planning is explicit;
- tools are controlled;
- guardrails prevent arbitrary execution;
- final answer uses computed data.

## Resulting Behavior

Available tools:

```txt
structured_query
  exact counts and filters

topic_candidate_search
  candidate search by topic

file_search
  semantic retrieval from corpus via Vector Store

dashboard_metrics_context
  aggregated view of the base
```

Flow:

```txt
user question
  -> query_planner_agent
  -> JSON plan with tool and required fields
  -> backend runs structured query, local search or File Search/Vector Store
  -> backend builds context_package for Agent 2
  -> query_answer_agent validates/writes using that package
  -> answer
```

The `query_planner_agent` does not answer the user. It acts as a reasoning/planning agent and decides, for example:

```txt
use structured_query
  when the question asks for count, filter or exact aggregation

use topic_candidate_search
  when the question involves area/topic and needs semantic validation

use file_search / Vector Store
  when the question requires semantic corpus passages,
  examples, justifications or textual content not solved by filters

use dashboard_metrics_context
  when the question is general about distribution or dataset summary
```

After that, the backend builds a `context_package` with the minimum necessary for the `query_answer_agent`, such as:

```txt
Agent 1 plan
locally calculated counts
filtered profile lists
candidates for semantic validation
aggregated metrics
passages retrieved from Vector Store
recent conversation history
```

## Guardrails

- Planner does not execute code.
- Backend only accepts known fields/operators.
- Counts are calculated locally whenever possible.
- Vector Store is used for semantic retrieval, not global totals.
- Agent 2 answers only based on the received package and must signal limitations.
- Topics go through semantic validation.
- Sent history is limited.
- The agent must signal when the answer depends on inference.

## Consequences

Advantages:

- satisfies RF04 more reliably;
- demonstrates agents, tools and planning;
- reduces numerical hallucination;
- preserves natural language;
- supports open-ended and structured questions.

Limitations:

- higher cost than a single call;
- higher latency;
- wrong tool choice may still happen;
- prompts and context require maintenance.

## Notes

Author: project team.

Date: 2026-06-02.

Main files:

- `app/services/chat_service.py`
- `app/services/chat_storage_service.py`
- `app/routers/chat.py`
- `app/routers/legacy_session.py`
