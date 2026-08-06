# ADR 0002: Bypass login for the local-only MVP

## Status

Accepted by the user.

## Context

The authoritative specification calls for authentication. The user explicitly chose to bypass login because the application runs only on their local machine for one person.

## Decision

Remove the local passphrase and signed-session implementation. Bind the Next.js application to `127.0.0.1` on port 3100 by default. Do not add OAuth, network exposure, or hosting in the MVP.

## Consequences

No local password or session secret is required. Anyone with access to the same macOS user account can open the app while it is running. Reintroduce authentication before any network exposure, multi-user access, or hosted deployment.
