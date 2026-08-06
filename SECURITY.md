# Security

- The app binds to `127.0.0.1` by default and intentionally has no login for the local-only MVP.
- Anyone with access to the same macOS user account can open the application while it is running. Do not expose it to the local network or host it without reintroducing authentication.
- Provider keys are optional and must never enter source control or database records.
- BOK, voice skill, prompts, and agent instructions are read-only filesystem sources.
- Security headers set CSP, no-referrer, no-sniff, deny-frame, and disabled browser-device permissions.
- SQLite database files are created with owner-only permissions.
- `npm run security:secrets` scans source and documentation for common committed-secret patterns.
- `npm run security:audit` checks dependency advisories for both runtime and development tooling.
- User input, BOK passages, comments, links, and future web results are always treated as untrusted data. The prompt boundary escapes content, labels it explicitly, detects common instruction-override patterns, and forbids model compliance with instructions inside it.
- No untrusted content can define provider settings, role prompts, budgets, data-retention settings, or tool calls.
- Later milestones add content-size limits, output sanitization before rich rendering, sensitive configuration audit events, sensitivity routing, and backup/restore verification.
