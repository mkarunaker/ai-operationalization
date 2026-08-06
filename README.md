# AI Editorial Board

Private local software for turning early thinking into reviewed written content without surrendering author judgment.

## Current state

Milestone 1 foundation is implemented. Conversational intake, BOK indexing, and Editorial Board execution are intentionally scheduled for later milestones.

## Local setup

1. Run `npm install`.
2. Run `npm run db:migrate`.
3. Run `npm run dev`.
4. Open `http://127.0.0.1:3100`.

No password or session secret is required for this local-only MVP. Keep the application bound to `127.0.0.1`; anyone with access to your Mac user account can open it while it is running.

Standard validation requires no API keys:

```bash
npm run lint
npm run typecheck
npm test
npm run db:validate
```

See [ARCHITECTURE.md](ARCHITECTURE.md), [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md), and [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md).
