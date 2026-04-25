// ─────────────────────────────────────────────
// Pulsarpay SDK — PulsarpayClient Tests
// ─────────────────────────────────────────────

import { describe, it, expect } from "vitest";
import { PulsarpayClient } from "../client";
import { AgentsResource } from "../resources/agents";
import { PaymentsResource } from "../resources/payments";

describe("PulsarpayClient — constructor", () => {
  it("instantiates successfully with a valid agentKey", () => {
    const client = new PulsarpayClient({ agentKey: "ag_live_abc123" });
    expect(client).toBeInstanceOf(PulsarpayClient);
  });

  it("exposes .agents as AgentsResource", () => {
    const client = new PulsarpayClient({ agentKey: "ag_live_abc123" });
    expect(client.agents).toBeInstanceOf(AgentsResource);
  });

  it("exposes .payments as PaymentsResource", () => {
    const client = new PulsarpayClient({ agentKey: "ag_live_abc123" });
    expect(client.payments).toBeInstanceOf(PaymentsResource);
  });

  it("accepts optional baseUrl and timeout without throwing", () => {
    expect(
      () =>
        new PulsarpayClient({
          agentKey: "ag_live_abc123",
          baseUrl: "https://staging.pulsarpay.io",
          timeout: 10_000,
        })
    ).not.toThrow();
  });
});
