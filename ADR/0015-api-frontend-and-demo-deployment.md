# ADR 0015: API, frontend and demonstration deployment

Status: accepted

## Motivating Requirement

RF02, RF03 and RF04 require a usable interface. The initial document also asks for implementation, technologies, tests and deployment documentation.

## Architectural Problem

We had to deliver a navigable application within the project timeframe. The reused frontend already had login and chat, but came from another domain. The old backend did not match the current architecture.

There was also uncertainty about exposing the application to another device using free ngrok.

## Decision

We will use:

```txt
backend: FastAPI
frontend: Next/React
login: hardcoded demo route
storage: local filesystem
presentation: preferably local
ngrok: optional, with CORS prepared
```

Demo credentials:

```txt
admin@admin.com
admin
```

## Rationale

FastAPI fits well with Python scripts and local services. Next/React enables dashboard and chat with a good user experience.

Real login and full deployment were not central requirements. This decision keeps the focus on agents, data and visualization.

## Resulting Behavior

Main routes:

```txt
POST /login
GET /
GET /dashboard/metrics
GET /profiles
GET /profiles/export.csv
POST /session
POST /session/{id}/message
POST /admin/pipeline/run
GET /admin/pipeline/status
```

Frontend:

```txt
/login
/dashboard
/profiles
/chat
```

## Guardrails

- Demo login is not production.
- CORS accepts localhost and ngrok when needed.
- Test locally before presenting.
- Chat streaming must be tested if proxy/ngrok is used.

## Consequences

Advantages:

- fast integration;
- safer local presentation;
- real frontend to demonstrate RF02/RF04;
- backend is simple to explain.

Limitations:

- external deployment is not the focus;
- free ngrok may add latency and temporary URLs;
- authentication is only demonstrative;
- local filesystem does not scale to production.

## Notes

Author: project team.

Date: 2026-06-02.

Main files:

- `app/main.py`
- `app/routers/auth.py`
- `frontend/`
