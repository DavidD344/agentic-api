# ADR 0008: Multi-agent model by requirement responsibility

Status: accepted

## Motivating Requirement

The assignment explicitly asks for a multi-agent system and documentation of:

```txt
flow
orchestrator
handoffs
tools
guardrails
reasoning and planning
collaboration
implementation
tests
deployment
```

The initial document split the problem into:

- dataset;
- dashboard;
- queries;
- logs;
- orchestrator.

## Architectural Problem

Isolated LLM calls do not, by themselves, define a multi-agent architecture. We needed to map real system responsibilities to agents and handoffs.

## Decision

We will represent each main responsibility as a conceptual or operational agent:

```txt
orchestrator_agent
collector_agent
lattesResearch_agent / lattes_preview_agent
lattes_full_agent
scholarResearch_agent
inference_agent
genderGuesser_agent / sex_review_agent
search_context_agent
dashboard_agent
profile_search_agent
query_planner_agent
query_answer_agent
chat_title_agent
```

Not every agent needs to be an LLM. Some are deterministic scripts; others are services; others are OpenAI calls.

## Rationale

This modeling follows the initial document and avoids confusing "agent" with "language model". In our system, agent means:

```txt
isolated responsibility + input + tool + output + handoff
```

This makes collaboration and guardrails concrete.

## Resulting Behavior

Simplified flow:

```txt
orchestrator_agent
  -> collector_agent
  -> lattes_preview_agent
  -> lattes_full_agent
  -> inference_agent
  -> normalization_agent
  -> sex_review_agent
  -> search_context_agent
  -> dashboard_agent/profile_search_agent/query_agent
```

## Tools

- Playwright;
- BeautifulSoup;
- CSV/JSON;
- OpenAI Responses API;
- File Search / Vector Store;
- FastAPI;
- Next/React.

## Guardrails

- LLM does not replace official sources.
- LLM does not execute arbitrary code.
- Deterministic agents are preferred when sufficient.
- Each stage generates logs/artifacts.
- Invalid runs do not promote the base.

## Consequences

Advantages:

- architecture aligned with the requirement;
- clear explanation in slides;
- testable responsibilities;
- documented handoffs;
- lower coupling.

Limitations:

- more documentation;
- more contracts between stages;
- some agents are conceptual, not independent processes;
- required adapting the frontend/backend to the model.

## Notes

Author: project team.

Date: 2026-06-02.

Related documents:

- `AGENTS_AND_LLM_CALLS.md`
- `TOOL_PROCESS_FROM_ZERO.md`
- `SYSTEM_OVERVIEW.md`
