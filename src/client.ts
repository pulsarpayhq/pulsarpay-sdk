// ─────────────────────────────────────────────
// Pulsarpay SDK — Main Client
// ─────────────────────────────────────────────

import { HttpClient } from "./http-client.js";
import { AgentsResource } from "./resources/agents.js";
import { PaymentsResource } from "./resources/payments.js";
import { PulsarpayUnauthorizedError } from "./errors/index.js";
import type { PulsarpayConfig } from "./types/index.js";

const DEFAULT_BASE_URL = "https://www.pulsarpay.io";
const DEFAULT_TIMEOUT = 30_000;

export class PulsarpayClient {
  /** Register agents. Does not require an agentKey. */
  public readonly agents: AgentsResource;

  /**
   * Create charges, list charges, get earnings, and withdraw funds.
   * Requires an `agentKey` to be set in the constructor.
   */
  public readonly payments: PaymentsResource;

  private readonly http: HttpClient;
  private readonly agentKey?: string;

  /**
   * Create a new Pulsarpay SDK client.
   *
   * `agentKey` is optional — you only need it for payment operations.
   * To register a new agent (and get your key), instantiate without one:
   *
   * @example
   * ```ts
   * // Register a new agent — no key needed
   * const client = new PulsarpayClient({});
   * const { apiKey } = await client.agents.register({ ... });
   *
   * // Use the key for payment operations
   * const authedClient = new PulsarpayClient({ agentKey: apiKey });
   * await authedClient.payments.getEarnings();
   * ```
   */
  constructor(config: PulsarpayConfig) {
    this.agentKey = config.agentKey;

    this.http = new HttpClient(
      config.baseUrl ?? DEFAULT_BASE_URL,
      config.timeout ?? DEFAULT_TIMEOUT
    );

    this.agents = new AgentsResource(this.http);
    this.payments = new PaymentsResource(this.http, () => {
      if (!this.agentKey) {
        throw new PulsarpayUnauthorizedError(
          "[Pulsarpay] agentKey is required for payment operations. " +
          "Pass it via config.agentKey when instantiating PulsarpayClient."
        );
      }
      return this.agentKey;
    });
  }
}
