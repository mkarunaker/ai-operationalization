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

For an explicit live editorial run, place the local-only values in `.env.local`, then restart the server. The file is Git-ignored and is never sent to the browser. The Board defaults to the **Balanced quality** profile: GPT-5.6 Terra for judgment and the main draft, with GPT-5.6 Luna for the low-cost derived short post and proofread. **Frontier content** is an explicit Board choice: GPT-5.6 Sol is used only for the main draft, while the other Board stages stay on Luna so the same hard per-run ceiling applies. Anthropic and ZenMux remain optional providers and are never automatic fallbacks.

```bash
OPENAI_API_KEY="…"
OPENAI_LOW_MODEL="gpt-5.6-luna"
OPENAI_MEDIUM_MODEL="gpt-5.6-terra"
OPENAI_HIGH_MODEL="gpt-5.6-sol"
EDITORIAL_RUN_BUDGET_USD="0.75"
EDITORIAL_MAX_RUN_BUDGET_USD="0.75"
EDITORIAL_REVIEWER_MAX_OUTPUT_TOKENS="1600"
EDITORIAL_INITIAL_DRAFTER_MAX_OUTPUT_TOKENS="2400"
```

The browser never receives a key. The committed provider policy is [src/config/model-routing.ts](src/config/model-routing.ts), while model IDs remain in `.env.local`; capability roles therefore remain separate from providers and model names. Strategist, Skeptic, and Editor use low reasoning with a server-only, cost-reserved 1,600-token allowance by default; an operator may set `EDITORIAL_REVIEWER_MAX_OUTPUT_TOKENS` from 1,200 to 3,000. The Synthesizer also uses low reasoning while retaining its fixed 1,000-token allowance. The Initial Drafter receives 2,400 tokens by default and accepts `EDITORIAL_INITIAL_DRAFTER_MAX_OUTPUT_TOKENS` from 2,000 to 5,000. Restart before starting a new Board run after changing either configurable allowance. Each Board snapshot records the exact allowance it used. Current official OpenAI prices are built in as operator-maintained estimates and may be overridden with matching `OPENAI_{LOW|MEDIUM|HIGH}_{INPUT|CACHED_INPUT|OUTPUT}_USD_PER_MILLION` values. Before each live Board run, the review screen displays every planned provider/model, pricing basis, estimate, quality profile, and editable budget cap. It refuses to dispatch when the upper-bound reservation exceeds the selected cap, which can never exceed $0.75. A higher-tier rerun remains a one-role action and retains the original Board and draft.

Custom editorial illustrations use a separate explicit route: set both `OPENAI_CUSTOM_IMAGE_MODEL` and a current fixed `OPENAI_CUSTOM_IMAGE_PRICE_USD`, then restart the local server. The app never chooses an image model or price by fallback; it displays the configured estimate before the author approves one generation. Each attempt is retained as local provenance, and generated PNG files remain in the configured ignored `VISUALS_PATH` directory.

See [BUILD_ROADMAP.md](BUILD_ROADMAP.md), [ARCHITECTURE.md](ARCHITECTURE.md), [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md), and [docs/LOCAL_BACKUP.md](docs/LOCAL_BACKUP.md).
