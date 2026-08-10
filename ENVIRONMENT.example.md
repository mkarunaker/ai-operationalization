# Local environment configuration

Create a local `.env.local` file that is never committed. Configure these values on your machine:

- `APP_BASE_URL`: local application URL, normally `http://127.0.0.1:3100`
- `DATABASE_PATH`: local SQLite database path
- `VISUALS_PATH`: local directory for generated visual SVG artifacts (defaults to `./visuals`, separate from application data)
- `EAIO_BOK_PATH`: local path to `EAIO_Canonical_Knowledge_Base.md`
- `KK_VOICE_SKILL_PATH`: local path to `kk-spoken-voice`
- `OPENAI_COMPATIBLE_API_KEY`: optional, only when a later milestone enables that provider
- `ANTHROPIC_API_KEY`: optional, only when a later milestone enables that provider

Do not place real credentials in any tracked file.
