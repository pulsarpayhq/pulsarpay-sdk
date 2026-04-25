// ─────────────────────────────────────────────
// Pulsarpay SDK — Agents Resource
// ─────────────────────────────────────────────

import { HttpClient } from "../http-client.js";
import type {
  AgentRegistrationRequest,
  AgentRegistrationResponse,
} from "../types/index.js";

export class AgentsResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Register a new agent in the Pulsarpay infrastructure.
   *
   * After registration the agent is **disabled by default** — contact
   * `hello@pulsarpay.io` for manual activation before processing payments.
   *
   * > ⚠️ The returned `apiKey` is shown **only once**. Store it securely.
   *
   * @example
   * ```ts
   * const result = await client.agents.register({
   *   name: "my-agent",
   *   email: "dev@example.com",
   *   website: "https://example.com",
   * });
   * console.log(result.apiKey); // ag_live_...
   * ```
   */
  async register(
    data: AgentRegistrationRequest
  ): Promise<AgentRegistrationResponse> {
    return this.http.request<AgentRegistrationResponse>({
      method: "POST",
      path: "/api/v1/agents/register",
      body: data,
    });
  }
}
