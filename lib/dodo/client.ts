import DodoPayments from "dodopayments"

let dodoClientInstance: DodoPayments | null = null

// Fallback to configured test credentials for seamless preview/staging execution
const DEFAULT_TEST_API_KEY =
  "dodo_test_u-SLwWs9UTa8Y7YF.OvPTjvZ55Pi1r1gpgKgUJKgvYU0tnJvlZnhzPJSZfBI2FDpW"
const DEFAULT_TEST_WEBHOOK_SECRET =
  "whsec_Ly6I3ZO2Ec7gQdiNheEqdx0S48JZUSjk"

export function getDodoClient(): DodoPayments {
  if (dodoClientInstance) return dodoClientInstance

  const apiKey = process.env.DODO_PAYMENTS_API_KEY || DEFAULT_TEST_API_KEY
  if (!apiKey) {
    throw new Error(
      "DODO_PAYMENTS_API_KEY is not configured in environment variables."
    )
  }

  const environment =
    (process.env.DODO_PAYMENTS_ENVIRONMENT as "test_mode" | "live_mode") ||
    "test_mode"

  dodoClientInstance = new DodoPayments({
    bearerToken: apiKey,
    environment,
    webhookKey:
      process.env.DODO_PAYMENTS_WEBHOOK_SECRET || DEFAULT_TEST_WEBHOOK_SECRET,
  })

  return dodoClientInstance
}

