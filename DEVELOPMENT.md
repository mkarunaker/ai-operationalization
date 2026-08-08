# Development

Use Node 22.5 or newer. This workspace currently uses the Node built-in `node:sqlite` module, so Docker, PostgreSQL, and a host `psql` executable are not required.

Run `npm run db:migrate` before starting the app. For meaningful existing data with pending migrations, first run `npm run db:backup`; normal application requests never apply migrations automatically. `npm run content:index` validates configured content-source paths and refreshes the local heading-aware FTS index. See `BUILD_ROADMAP.md` for the active implementation sequence and `docs/LOCAL_BACKUP.md` before database changes.

Live model calls are opt-in. The committed finance-first route is OpenAI low/medium/high, with model IDs supplied through `.env.local`. Copy only the non-secret shape from `.env.example`; never commit `.env.local`. Tests and builds must use the deterministic local provider and must not make external model calls.
