# AI Editorial Board

Private local software for turning early thinking into reviewed written content without surrendering author judgment.

## Current state

Milestone 1 foundation is implemented. Conversational intake, BOK indexing, and Editorial Board execution are intentionally scheduled for later milestones.

## Local setup

1. Create an untracked `.env.local` using [ENVIRONMENT.example.md](ENVIRONMENT.example.md), then set `APP_SESSION_SECRET` and `LOCAL_AUTH_PASSWORD`.
2. Run `npm install`.
3. Run `npm run db:migrate`.
4. Run `npm run dev`.
5. Open `http://127.0.0.1:3100`.

Standard validation requires no API keys:

```bash
npm run lint
npm run typecheck
npm test
npm run db:validate
```

See [ARCHITECTURE.md](ARCHITECTURE.md), [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md), and [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md).
