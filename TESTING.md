# Testing

The standard suite must not make live model calls.

- `npm test`: unit, contract, schema, and migration tests.
- `npm run typecheck`: strict TypeScript validation.
- `npm run lint`: framework and source checks.
- `npm run db:validate`: verifies migration inventory.

Mock provider output is deterministic so cost and workflow tests do not require API keys.
