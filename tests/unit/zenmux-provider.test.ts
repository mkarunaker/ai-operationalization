import { describe, expect, it } from "vitest";
import { ZenMuxChatCompletionsProvider } from "@/ai/zenmux-provider";

describe("ZenMuxChatCompletionsProvider", () => {
  it("uses the OpenAI-compatible chat endpoint without tools and parses JSON output", async () => {
    let requestUrl = "";
    let requestBody: Record<string, unknown> | undefined;
    const provider = new ZenMuxChatCompletionsProvider({
      apiKey: "test-key",
      fetch: async (input, init) => {
        requestUrl = String(input);
        requestBody = JSON.parse(String(init?.body));
        return new Response(JSON.stringify({
          id: "gen_test",
          model: "xai/grok-test",
          choices: [{ finish_reason: "stop", message: { content: "```json\n{\"role\":\"skeptic\"}\n```" } }],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
        }), { status: 200 });
      },
    });

    const result = await provider.generate({
      provider: "zenmux",
      model: "xai/grok-test",
      systemPrompt: "Return JSON.",
      messages: [{ role: "user", content: "Test." }],
      responseFormat: {},
    });

    expect(requestUrl).toBe("https://zenmux.ai/api/v1/chat/completions");
    expect(requestBody).toMatchObject({ model: "xai/grok-test", tools: [], response_format: { type: "json_object" } });
    expect(result.structuredOutput).toEqual({ role: "skeptic" });
    expect(result.providerRequestId).toBe("gen_test");
  });

  it("returns a credential-safe error category", async () => {
    const provider = new ZenMuxChatCompletionsProvider({
      apiKey: "test-key",
      fetch: async () => new Response(JSON.stringify({ error: { type: "authentication_error", message: "do not expose" } }), { status: 401 }),
    });
    await expect(provider.generate({ provider: "zenmux", model: "xai/grok-test", systemPrompt: "x", messages: [] }))
      .rejects.toThrow("ZenMux request failed (401; authentication_error).");
  });
});
