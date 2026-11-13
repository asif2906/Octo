import DodoPayments from "dodopayments"

let dodoClientInstance: DodoPayments | null = null

export function getDodoClient(): DodoPayments {
  if (dodoClientInstance) return dodoClientInstance

  const apiKey = process.env.DODO_PAYMENTS_API_KEY
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
    webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_SECRET,
  })

  return dodoClientInstance
}

