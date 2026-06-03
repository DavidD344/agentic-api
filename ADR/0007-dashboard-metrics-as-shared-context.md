# ADR 0007: Dashboard metrics as shared agent context

Status: accepted

## Motivating Requirement

RF02 requires a dashboard. RF04 requires natural language queries. Both need to know global metrics from the same dataset.

The initial document also planned collaboration between agents and handoffs. The dashboard should not be isolated from the chat.

## Architectural Problem

If the dashboard and chat calculate metrics separately, they may produce divergent answers:

```txt
dashboard shows 46 people from USP
chat answers another number
```

It would also be wasteful to create a manual summary for the LLM while an aggregated metrics route already exists.

## Decision

We will reuse `build_dashboard_metrics()` as shared context for query agents.

We will also generate a minimal profile context:

```txt
name
first name
inferred sex
institution
scholarship
scholarship category
state
region
```

## Rationale

The dashboard already represents the consolidated view of the base. Using its metrics in chat increases consistency and reduces duplicated work.

The minimal context helps the planner understand names, institutions and overall distribution without sending the full curriculum.

## Resulting Behavior

```txt
dashboard_agent
  -> computes metrics

minimal_profiles_context_agent
  -> generates compact summary per person

query_planner_agent/query_answer_agent
  -> receive metrics + minimal context
```

## Guardrails

- Context comes from the active base in `current.json`.
- Inferred fields must be treated as analytical support.
- Metrics are used as guidance; specific counts can still be recalculated by a local tool.
- Minimal context does not replace detailed search when the question needs evidence.

## Consequences

Advantages:

- consistency between dashboard and chat;
- better question planning;
- less duplicated logic;
- easier to defend results in the presentation.

Limitations:

- increases tokens per call;
- must be regenerated when the base changes;
- inferred fields carry uncertainty;
- minimal context does not contain every curriculum detail.

## Notes

Author: project team.

Date: 2026-06-02.

Related:

- ADR 0011
- ADR 0012
- ADR 0013
- ADR 0014
