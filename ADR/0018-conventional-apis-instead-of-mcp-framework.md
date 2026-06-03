# ADR 0018: Conventional APIs instead of a dedicated MCP/multi-agent framework

Status: accepted

## Motivating Requirement

The assignment asks us to discuss MCPs, tools, guardrails, reasoning, planning and implementation. It allows the use of conventional APIs.

The initial document also asked how to organize agents, tools and handoffs.

## Architectural Problem

We could implement the system with:

- a dedicated multi-agent framework;
- MCP servers for tools;
- conventional APIs;
- isolated scripts without an API.

For the MVP, the priority was to deliver dataset, dashboard, chat and logs in a functional way.

## Decision

We will implement with conventional APIs:

```txt
FastAPI
Python scripts
OpenAI Responses API
File Search / Vector Store
Next/React frontend
CSV/JSON files
```

We will not create a custom MCP server in this version.

## Rationale

The required tools are local and simple:

- read JSON;
- filter profiles;
- calculate metrics;
- run scraping;
- call LLM;
- synchronize corpus.

Creating MCP would add complexity that is not necessary to demonstrate the requirements. The architecture still documents tools and handoffs, but implements these tools directly in FastAPI/Python services.

## Resulting Behavior

System tools are functions and services:

```txt
build_dashboard_metrics()
list_profiles()
execute_structured_plan()
ensure_vector_store()
run_pipeline()
scrapers/*.py
```

Agents call these tools through local services or HTTP routes.

## Guardrails

- The LLM does not get free access to the system.
- Tools are controlled backend functions.
- There is no arbitrary execution of model-generated code.
- MCP can be added later if external tool integration becomes necessary.

## Consequences

Advantages:

- lower complexity;
- easier to explain;
- lower presentation risk;
- direct implementation in Python/FastAPI;
- compatible with the deadline.

Limitations:

- does not demonstrate a real MCP server;
- future external-tool integration would require adaptation;
- part of the agents are conceptual/services, not a dedicated multi-agent runtime.

## Notes

Author: project team.

Date: 2026-06-02.

Related:

- ADR 0008
- ADR 0014
- ADR 0015
