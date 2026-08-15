import { describe, expect, it } from "vitest";
import { POST as boardPost } from "../../app/api/board/[ideaId]/route";
import { POST as notebookPost } from "../../app/api/editorial-notebook/route";
import { POST as ideaDetailPost } from "../../app/api/ideas/[ideaId]/route";
import { POST as ideasPost } from "../../app/api/ideas/route";
import { POST as intakeDetailPost } from "../../app/api/intake/[ideaId]/route";
import { POST as intakePost } from "../../app/api/intake/route";
import { POST as voiceCheckPost } from "../../app/api/voice-check/route";

const detailContext = { params: Promise.resolve({ ideaId: "test-idea" }) };
const routes = [
  ["ideas", (request: Request) => ideasPost(request)],
  ["notebook", (request: Request) => notebookPost(request)],
  ["intake", (request: Request) => intakePost(request)],
  ["intake detail", (request: Request) => intakeDetailPost(request, detailContext)],
  ["legacy board", (request: Request) => boardPost(request, detailContext)],
  ["idea detail", (request: Request) => ideaDetailPost(request, detailContext)],
  ["exact voice check", (request: Request) => voiceCheckPost(request)],
] as const;

function request(url: string, headers: Record<string, string>) {
  return new Request(url, { method: "POST", headers, body: "{}" });
}

describe("state-changing route request boundaries", () => {
  for (const [name, post] of routes) {
    it(`${name} rejects non-JSON, cross-origin, and non-loopback requests before invoking a service`, async () => {
      for (const unsafe of [
        request("http://127.0.0.1:3100/api/test", { "content-type": "text/plain" }),
        request("http://127.0.0.1:3100/api/test", { "content-type": "application/json" }),
        request("http://127.0.0.1:3100/api/test", { "content-type": "application/json", origin: "https://example.test", "sec-fetch-site": "cross-site" }),
        request("http://127.0.0.1:3100/api/test", { "content-type": "application/json", origin: "http://localhost:3100", "sec-fetch-site": "same-origin" }),
        request("http://127.0.0.1:3100/api/test", { "content-type": "application/json", origin: "http://[::1]:3100", "sec-fetch-site": "same-origin" }),
        request("http://127.0.0.1:3100/api/test", { "content-type": "application/json", origin: "http://localhost:3101", "sec-fetch-site": "same-origin" }),
        request("http://example.test/api/test", { "content-type": "application/json" }),
      ]) {
        const response = await post(unsafe);
        expect(response.status).toBe(400);
        expect((await response.json()).error).toMatch(/application\/json|Cross-origin|local application origin|exact local application origin/);
      }
    });
  }
});
