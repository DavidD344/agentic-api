# ADR 0013: Dashboard and profile search with precomputed metrics

Status: accepted

## Motivating Requirement

RF02 requires a dashboard for data visualization. RF03 requires generating files with selected information. The initial document planned a `report_agent`.

In addition, the presentation must show analytical value from the dataset, not only files.

## Architectural Problem

The frontend could calculate charts directly from the final JSON, but that would duplicate rules and make dashboard, chat and export use different logic.

It was also necessary to create a researcher search screen with filters by name, institution, scholarship, region and topics.

## Decision

We will centralize metrics and search in the backend:

```txt
dashboard_agent
  -> GET /dashboard/metrics

profile_search_agent
  -> GET /profiles
  -> GET /profiles/{profile_id}
  -> GET /profiles/export.csv
```

The frontend consumes these routes.

## Rationale

Backend metrics are easier to test and reuse in chat. Backend search avoids loading the entire dataset in the browser and supports pagination.

## Resulting Behavior

The dashboard shows, among others:

- total scholarship holders;
- distribution by scholarship;
- distribution by inferred sex;
- region/state;
- main area;
- scholarship cross-tabs;
- time since doctorate;
- dynamic charts with filters.

Researcher search allows:

- searching by name;
- filtering by scholarship/institution/region;
- topic search with normalization and textual similarity;
- viewing photo, summary and main data.

## Handoffs

```txt
profiles_with_inferences.json
  -> dashboard_agent
  -> profile_search_agent
  -> frontend dashboard/profiles
```

## Guardrails

- The dashboard uses only the active base.
- Inferred fields are presented as inferred.
- `needs_review` should not be treated as the main visual error.
- Export uses the same active dataset.

## Consequences

Advantages:

- consistent charts;
- simpler frontend;
- direct export;
- chat can reuse metrics;
- paginated and filterable search.

Limitations:

- in-memory calculation;
- a much larger dataset would require cache/database;
- inference-based charts must be explained;
- PDF export remains future work, while CSV was prioritized.

## Notes

Author: project team.

Date: 2026-06-02.

Main files:

- `app/services/dashboard_service.py`
- `app/services/profile_service.py`
- `app/routers/dashboard.py`
- `app/routers/profiles.py`
- `frontend/src/screens/dashboard/Dashboard.tsx`
