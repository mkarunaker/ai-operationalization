# Model Provider Interface

`src/ai/provider.ts` defines the normalized provider contract.

Every adapter must normalize requests, responses, token categories, latency, provider request IDs, finish reasons, and raw usage. Vendor SDKs must remain inside adapter modules. `MockModelProvider` is the standard no-key implementation used by tests.

The application records estimates from dated pricing records and stores actual billed cost only when the provider supplies it.
