# ADR 0006: Hardcoded authentication for demonstration

Status: temporarily accepted

## Motivating Requirement

The main requirement does not demand real authentication. However, the reused frontend already had a login flow, token handling and protected screens.

To present RF02, RF03 and RF04 in the frontend, the application needed a simple way to log in.

## Architectural Problem

The options were:

- implement real authentication with a database;
- reuse the old backend;
- remove authentication from the frontend;
- create a demo login.

Implementing real authentication would consume time outside the project scope. Reusing the old backend would increase coupling with code that was not part of the multi-agent solution.

## Decision

We will create a local demonstration route:

```txt
POST /login
```

Credentials:

```txt
email: admin@admin.com
password: admin
```

The response keeps the contract expected by the frontend.

## Rationale

Authentication supports the demonstration, but it is not central to the agents. This decision lets us focus on dataset, dashboard, query and logs.

## Resulting Behavior

The `auth_router` responds with:

```txt
id
name
token
role
email
```

The token is a demo token and only enables the frontend flow.

## Guardrails

- Do not treat this login as real security.
- Do not use it in production.
- Document that it is a temporary choice for the presentation.

## Consequences

Advantages:

- fast integration;
- preserves the frontend flow;
- reduces scope;
- enough for the demo.

Limitations:

- not secure;
- no registration;
- no real multi-user support;
- not suitable for production.

## Notes

Author: project team.

Date: 2026-06-02.

Related:

- ADR 0015
