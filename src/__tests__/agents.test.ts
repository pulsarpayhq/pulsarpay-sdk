// ─────────────────────────────────────────────
// Pulsarpay SDK — AgentsResource Tests
// ─────────────────────────────────────────────

import { describe, it, expect, afterEach, vi } from "vitest";
import { PulsarpayClient } from "../client";
import {
  PulsarpayBadRequestError,
  PulsarpayConflictError,
} from "../errors/index";
import {
  mockFetch,
  mockJsonResponse,
  fixtures,
  AGENT_KEY,
} from "./helpers";

afterEach(() => {
  vi.restoreAllMocks();
});

function makeClient() {
  return new PulsarpayClient({ agentKey: AGENT_KEY });
}

describe("agents.register()", () => {
  it("returns registration response with apiKey on success", async () => {
    mockFetch(mockJsonResponse(fixtures.agentRegistration));

    const client = makeClient();
    const result = await client.agents.register({
      name: "test-agent",
      email: "dev@test.com",
      website: "https://test.com",
    });

    expect(result.apiKey).toBe("ag_live_xxxxxxxxxxxxxxxxxx");
    expect(result.enabled).toBe(false);
    expect(result.message).toContain("hello@pulsarpay.io");
  });

  it("sends POST to /api/v1/agents/register with correct body", async () => {
    const fetchMock = mockFetch(mockJsonResponse(fixtures.agentRegistration));

    const client = makeClient();
    const payload = {
      name: "my-agent",
      email: "dev@example.com",
      website: "https://example.com",
    };
    await client.agents.register(payload);

    const [url, options] = (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/v1/agents/register");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body as string)).toEqual(payload);
  });

  it("throws PulsarpayBadRequestError on invalid email", async () => {
    mockFetch(mockJsonResponse({ error: "Invalid email format" }, 400));

    const client = makeClient();
    await expect(
      client.agents.register({
        name: "agent",
        email: "not-an-email",
        website: "https://example.com",
      })
    ).rejects.toThrow(PulsarpayBadRequestError);
  });

  it("throws PulsarpayBadRequestError on invalid website URL", async () => {
    mockFetch(mockJsonResponse({ error: "Invalid website URL" }, 400));

    const client = makeClient();
    await expect(
      client.agents.register({
        name: "agent",
        email: "dev@example.com",
        website: "not-a-url",
      })
    ).rejects.toThrow(PulsarpayBadRequestError);
  });

  it("throws PulsarpayBadRequestError when required fields are missing", async () => {
    mockFetch(
      mockJsonResponse({ error: "Name, email, and website are required" }, 400)
    );

    const client = makeClient();
    await expect(
      // @ts-expect-error intentionally incomplete payload
      client.agents.register({ name: "agent" })
    ).rejects.toThrow(PulsarpayBadRequestError);
  });

  it("throws PulsarpayConflictError when agent name already exists", async () => {
    mockFetch(
      mockJsonResponse(
        { error: "Agent name already exists. Please choose a different one." },
        409
      )
    );

    const client = makeClient();
    const err = await client.agents
      .register({
        name: "existing-agent",
        email: "dev@example.com",
        website: "https://example.com",
      })
      .catch((e) => e);

    expect(err).toBeInstanceOf(PulsarpayConflictError);
    expect(err.message).toContain("Agent name already exists");
  });
});
