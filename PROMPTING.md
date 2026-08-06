# Prompting

Prompt files live under `prompts/shared` and `prompts/roles`; they are versioned filesystem source material. The external `kk-spoken-voice` source must never be copied into the repository.

All retrieved or user-supplied material is untrusted data. It must be placed inside the application-owned untrusted-context boundary, never merged into the system prompt, and scanned for instruction-override, role-override, secret-exfiltration, and tool-override signals. Suspicious context is ignored as instruction and surfaced for user review.

Review prompts must request structured output that validates against `schemas/agent-outputs`. A failed validation receives one repair attempt in the later Editorial Board milestone; raw output and repair cost are retained if repair fails.
