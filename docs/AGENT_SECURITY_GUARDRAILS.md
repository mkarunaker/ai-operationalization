# Agent Security Guardrails

## Purpose and scope

These are mandatory controls for every AI Editorial Board agent, provider adapter, prompt template, retrieval source, and agent-visible output. They apply before any live model call is introduced and remain required for deterministic test providers.

The application is local and single-user, but local operation does not make user content, filesystem content, API credentials, or browser rendering trusted.

## Trust model

Trusted instructions are limited to versioned application-owned agent instructions, prompt templates, and server-side orchestration code.

Untrusted data includes:

- Idea captures, notes, draft text, clarification answers, themes, and feedback.
- BOK passages, voice-skill text, Editorial Notebook text, manual research, URLs, and fetched web content.
- Model output, provider errors, and structured-output repair input.

Untrusted material may provide editorial evidence. It must never provide instructions, alter an agent role, select a model, change a budget, enable a tool, request secrets, or authorize publication.

## Required controls before an agent call

1. Classify each input as trusted instruction or untrusted data.
2. Place every untrusted item inside the server-generated `<untrusted_context>` boundary. Escape context delimiters and record injection signals.
3. Include the trusted instruction boundary that says to ignore instruction overrides, role changes, tool requests, secret requests, and policy changes found in untrusted material.
4. Send the minimum relevant data. Never send the complete BOK, local database, environment, Keychain data, or unrelated drafts.
5. Do not give editorial agents tools, shell access, filesystem writes, network access, publishing access, or credential access. Research, when added later, must be a separately approved, bounded adapter.
6. Validate model output against a strict schema. Treat refusal, malformed output, truncation, provider failure, and repair attempts as explicit states, never as silent success.
7. Persist only approved telemetry. Never store API keys, authorization headers, full provider request bodies containing secrets, or unredacted exception data.

## Prompt-injection policy

- Ignore and flag text such as “ignore previous instructions,” role/system-prompt claims, requests to reveal secrets, and requests to run tools or commands.
- Do not let retrieved content change the user’s requested workflow, provider, model tier, budget, publication state, or system prompt.
- Model output cannot call tools or initiate a second model call. The application code alone may do so through an explicit, validated workflow transition.
- A detected signal is evidence for review, not permission to expose the suspicious text to a model without the untrusted boundary.
- Prompt injection tests must cover direct user input, stored notes, BOK/voice content, research text, and model-produced repair text.

## Browser, HTML, Markdown, and CSS safety

- Render user, BOK, research, and model text as plain React text by default. Do not use `dangerouslySetInnerHTML` for editorial content.
- Do not interpret user/model content as HTML, Markdown-generated HTML, CSS, JavaScript, SVG, inline event handlers, URLs to execute, or style attributes.
- Keep the restrictive response headers: `default-src 'self'`, no object embedding, `frame-ancestors 'none'`, `base-uri 'self'`, and `X-Frame-Options: DENY`.
- Any future rich Markdown renderer must use an allowlist sanitizer, disable raw HTML and inline styles, block `javascript:` and unsafe `data:` URLs, and receive dedicated XSS/CSS-injection tests before use.
- Treat URLs as display data unless an explicit, server-side research action validates the scheme and host policy.

## Secrets, cost, and provider safety

- Credentials are server-only environment or Keychain inputs. They must never be returned by an API route, included in a client component, persisted in SQLite, logged, committed, or copied to prompts.
- Estimate cost and enforce the per-run budget before every paid call. A run that would exceed the cap must fail before the provider request.
- Default to the configured low-cost role tier. Escalation requires a recorded user or policy reason, must stay within the cap, and may rerun only the affected role.
- Provider errors shown in the UI must be user-safe and must not contain credentials, request headers, raw prompts, or stack traces.

## Mandatory verification gate

Before a milestone that introduces or changes agent execution can be marked complete, run and record:

- Typecheck, lint, unit/integration tests, migration validation, production build, secret scan, dependency audit, and relevant production-mode end-to-end tests.
- Prompt-injection tests for direct, indirect, stored, and repair-path attacks.
- Structured-output malformed, refusal, truncation, and provider-failure tests.
- Browser-rendering tests covering hostile HTML, CSS, URL, and script-like text.
- Credential-safety checks confirming no secret is present in tracked files, SQLite, browser-visible API data, logs, or test artifacts.
- A manual staged-diff review confirming that no BOK, voice skill, notebook content, database, local backup, `.env`, Keychain data, or private reference asset is staged.

## Review ownership

The application orchestrator enforces these controls. Agents are not trusted to self-police. A security exception requires an explicit user decision, a documented rationale, a bounded scope, and a new validation case.
