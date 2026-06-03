# ADRs

This directory records the architectural decisions of the project.

For the consolidated system view, including agents, models, pipeline stages, routes, call costs and handoffs, see:

```txt
SYSTEM_OVERVIEW.md
```

Format used, following the ADR class material and the initial project document:

```txt
Title
Status
Motivating Requirement
Architectural Problem
Decision
Rationale / Resulting Behavior
Handoffs / Tools / Guardrails when applicable
Consequences
Notes
```

The adopted heuristic was:

```txt
1. start from RF01-RF05
2. identify which architectural decision the requirement forces
3. record alternatives and trade-offs
4. explain how the decision became agents, handoffs, tools and guardrails
5. point out impacts on implementation and presentation
```

Current ADRs:

```txt
0001-local-csv-json-storage.md
0002-scraping-pipeline-stages.md
0003-file-search-and-structured-query-chat.md
0004-two-agent-chat-flow.md
0005-topic-validation.md
0006-local-authentication-for-demo.md
0007-dashboard-metrics-as-shared-context.md
0008-multiagent-responsibility-model.md
0009-cnpq-and-lattes-scraping-strategy.md
0010-llm-assisted-lattes-disambiguation.md
0011-inference-pipeline-and-semantic-fields.md
0012-active-dataset-search-corpus-and-vector-store.md
0013-dashboard-and-profile-search-over-precomputed-metrics.md
0014-chat-planning-tools-and-response-validation.md
0015-api-frontend-and-demo-deployment.md
0016-google-scholar-as-optional-enrichment.md
0017-agent-logs-and-run-observability.md
0018-conventional-apis-instead-of-mcp-framework.md
```

## Coverage by requirement/decision

```txt
RF01 dataset:
  0001, 0002, 0008, 0009, 0010, 0011, 0012, 0016

RF02 dashboard:
  0007, 0013

RF03 export:
  0001, 0013

RF04 natural language:
  0003, 0004, 0005, 0012, 0014

RF05 logs:
  0001, 0002, 0008, 0009, 0011, 0017

Authentication and presentation:
  0006, 0015

Google Scholar:
  0016

MCP/tools/implementation:
  0008, 0014, 0018
```

## Coverage by agent

```txt
orchestrator_agent:
  0002, 0008

collector_agent:
  0009

lattes_preview_agent:
  0009, 0010

lattes_full_agent:
  0009

inference_agent:
  0011

normalization_agent:
  0011

sex_review_agent:
  0011

search_context_agent:
  0012

dashboard_agent:
  0007, 0013

profile_search_agent:
  0013

query_planner_agent:
  0004, 0014

query_answer_agent:
  0004, 0005, 0014

chat_title_agent:
  0014

scholarResearch_agent:
  0016

log/observability:
  0017

tools/MCP:
  0018
```
