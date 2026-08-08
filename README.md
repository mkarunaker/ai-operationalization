# AI Editorial Board

Private local software for turning early thinking into reviewed written content without surrendering author judgment.

## Current state

This is a **lean local workflow in active development**. The queue, local persistence, themes, drafts, versioned review history, publication records, and deterministic grounded test path are available. Each idea uses four focused, URL-backed stages: Develop, Editorial Board, Write, and Finalize. The grounded path retrieves relevant BOK sections, applies the configured voice skill during drafting, and records immutable source provenance. A server-only, model-agnostic gateway supports an explicit live Board run with a displayed estimate, cumulative cap enforcement, persisted stage progress, per-attempt token/cost telemetry, and one-reviewer escalation; it never runs automatically. Format-specific drafting and research remain later milestones.

Use [BUILD_ROADMAP.md](BUILD_ROADMAP.md) for the active milestone sequence and [LEAN_PRODUCT_SCOPE.md](LEAN_PRODUCT_SCOPE.md) for the accepted product direction. The older intake and dashboard surfaces remain legacy compatibility code.

## Local setup

1. Run `npm install`.
2. For an existing database with pending migrations, first run `npm run db:backup`, then run `npm run db:migrate`. Normal application requests never apply migrations automatically.
3. Run `npm run content:index` to validate and index the configured BOK and voice skill.
4. Run `npm run dev`.
5. Open `http://127.0.0.1:3100`.

No password or session secret is required for this local-only MVP. Keep the application bound to `127.0.0.1`; anyone with access to your Mac user account can open it while it is running.

Standard validation requires no API keys:

```bash
npm run lint
npm run typecheck
npm test
npm run db:validate
npm run content:index
```

## Optional live model run

For an explicit live editorial run, place the local-only values in `.env.local`, then restart the server. The file is Git-ignored and is never sent to the browser. The finance-first default reserves GPT-5 nano for future intake, title, and classification work; GPT-5.6 Luna performs the Editorial Board, synthesis, and drafting; GPT-5.4 mini is used only for an explicitly confirmed single-reviewer escalation. Anthropic and ZenMux remain optional providers and are never automatic fallbacks.

```bash
OPENAI_API_KEY="…"
OPENAI_LOW_MODEL="gpt-5-nano"
OPENAI_MEDIUM_MODEL="gpt-5.6-luna"
OPENAI_HIGH_MODEL="gpt-5.4-mini"
EDITORIAL_RUN_BUDGET_USD="0.05"
EDITORIAL_MAX_RUN_BUDGET_USD="0.25"
```

The browser never receives a key. The committed provider policy is [src/config/model-routing.ts](src/config/model-routing.ts), while model IDs remain in `.env.local`; capability roles therefore remain separate from providers and model names. Current official OpenAI prices are built in as operator-maintained estimates and may be overridden with matching `OPENAI_{LOW|MEDIUM|HIGH}_{INPUT|CACHED_INPUT|OUTPUT}_USD_PER_MILLION` values. Restart the server after configuration changes. Before each live Board run, the review screen displays every planned provider/model, pricing basis, estimate, and editable budget cap. A higher-tier rerun is available only for one reviewer at a time and retains the original Board and draft.

See [BUILD_ROADMAP.md](BUILD_ROADMAP.md), [ARCHITECTURE.md](ARCHITECTURE.md), [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md), and [docs/LOCAL_BACKUP.md](docs/LOCAL_BACKUP.md).
