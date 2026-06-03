# ADR 0012: Active base, search corpus and minimal context

Status: accepted

## Motivating Requirement

RF02, RF03 and RF04 need to consume the same final dataset. The initial document planned collaboration between agents and handoffs; therefore, the pipeline output must become stable input for dashboard, export and chat.

## Architectural Problem

Because the pipeline generates several timestamped folders, the system must know which run is active. In addition, the chat cannot send a 5MB JSON file on every question.

## Decision

We will use `scrape_results/current.json` as the active base manifest.

After a valid run, the system generates:

```txt
profiles_with_inferences.json
profiles_with_inferences.csv
profiles_search_corpus.json
profiles_search_corpus_metadata.json
minimal_profiles_context.json
minimal_profiles_context.txt
```

The corpus can be synchronized with OpenAI Vector Store, but the backend also keeps local structured queries.

## Rationale

`current.json` prevents each route from manually discovering the latest run. The compact corpus reduces chat cost. The minimal context lets agents know the overall structure without loading full curricula.

## Resulting Behavior

```txt
orchestrator_agent
  -> promotes current.json

search_context_agent
  -> generates corpus and minimal context

dashboard_agent/profile_search_agent/query_agent
  -> read current.json
```

## Tools

- local JSON;
- compact `.txt` file for context;
- optional OpenAI Vector Store;
- corpus hash to detect sync needs.

## Guardrails

- Do not automatically use the newest folder.
- Do not send the full corpus on every question.
- Vector Store does not replace structured queries.
- Test runs do not update `current.json`.

## Consequences

Advantages:

- explicit active base;
- simple rollback;
- dashboard and chat consistency;
- lower context cost;
- supports File Search when needed.

Limitations:

- minimal context still consumes tokens;
- corpus must be regenerated when data changes;
- Vector Store can become stale if not synchronized;
- very specific questions may require detailed search.

## Notes

Author: project team.

Date: 2026-06-02.

Main files:

- `app/services/search_corpus_service.py`
- `app/services/minimal_profiles_context_service.py`
- `app/services/openai_vector_store_service.py`
- `scrape_results/current.json`
