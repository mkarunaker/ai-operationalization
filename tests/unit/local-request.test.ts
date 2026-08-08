import { describe, expect, it } from "vitest";
import { requireLocalJsonMutation, safeRouteError } from "@/security/local-request";

describe("local mutation request boundary", () => {
  it("accepts same-origin loopback JSON", () => {
    const request = new Request("http://127.0.0.1:3100/api/ideas/test", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://127.0.0.1:3100",
        "sec-fetch-site": "same-origin",
      },
      body: "{}",
    });
    expect(() => requireLocalJsonMutation(request)).not.toThrow();

    const loopbackAlias = new Request("http://127.0.0.1:3101/api/ideas/test", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3101",
        "sec-fetch-site": "same-origin",
      },
      body: "{}",
    });
    expect(() => requireLocalJsonMutation(loopbackAlias)).not.toThrow();
  });

  it("rejects cross-origin, non-JSON, and non-loopback mutations", () => {
    expect(() => requireLocalJsonMutation(new Request("http://127.0.0.1:3100/api/test", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://example.com" },
      body: "{}",
    }))).toThrow("Cross-origin");
    expect(() => requireLocalJsonMutation(new Request("http://127.0.0.1:3100/api/test", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: "{}",
    }))).toThrow("application/json");
    expect(() => requireLocalJsonMutation(new Request("http://example.test/api/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    }))).toThrow("local application origin");
  });

  it("does not expose arbitrary internal errors", () => {
    expect(safeRouteError(new Error("SQLITE failure at /private/path"))).toBe(
      "The local request could not be completed safely.",
    );
  });
});
