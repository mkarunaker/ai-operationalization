# AI Editorial Board

Private local software for turning early thinking into reviewed written content without surrendering author judgment.

## Current state

Milestone 4 is underway with the local deterministic provider. The app includes local source loading and search, persistent intake and briefs, three executable workflow paths, independent Editorial Board roles, synthesis, recommendation decisions, and local traceability. Structured-output repair, partial-failure handling, live AI models, and final drafting are next.

## Local setup

1. Run `npm install`.
2. Run `npm run db:migrate`.
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

See [ARCHITECTURE.md](ARCHITECTURE.md), [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md), and [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md).
