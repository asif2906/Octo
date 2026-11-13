# OCTO.TECH — PHASE 4: IMPLEMENT FINAL PRICING, PLAN ENTITLEMENTS & DODO PAYMENTS CONFIGURATION

You are working on the existing Octo.tech application.

**Live application:** https://octo-pi-nine.vercel.app/

## Objective

Implement the updated two-plan subscription model across the existing application, configure the Dodo Payments integration, and prepare the application for subscription checkout and billing.

This is a focused update to the existing project. Do not rebuild the application or change unrelated functionality.

# 1. Final pricing — use these exact prices

There are only two subscription plans: Basic and Pro.

All displayed prices are inclusive of applicable taxes. Do not add another tax amount to the displayed prices.

| Billing interval | Basic | Pro |
|---|---:|---:|
| Weekly | $5 | $11 |
| Monthly | $12 | $24 |

Requirements:
- Weekly and monthly billing must both be available.
- Clearly label prices as tax-inclusive.
- Do not advertise additional taxes on top of these displayed prices.
- Do not silently change the final amount charged at checkout.
- Configure Dodo product prices and tax settings consistently with the tax-inclusive pricing model.
- Confirm how Dodo handles tax-inclusive pricing for the account's configured business location and applicable customer locations before enabling live payments.
- If Dodo's checkout displays a different total, resolve the configuration rather than misleading users.

There is no Free plan and no Lite plan.

# 2. Plan features and entitlements

Keep the previously established feature limits and entitlements.

| Feature | Basic | Pro |
|---|---|---|
| Auto-apply | 10 per day | 20 per day |
| Cold emails | 15 per day | 20 per day |
| Recipients | User's own list | User's own list + founder/CEO database |
| Resume builder | Yes — fair use | Yes — higher fair-use limit |
| AI resume tailoring | Yes — fair use | Yes — higher fair-use limit |
| Follow-up emails | Basic | Advanced |
| Application tracker | Full | Full + analytics |

Do not invent numerical fair-use limits. Keep them configurable.

## Pro positioning

Pro costs twice as much as Basic on monthly billing. Its value must be immediately understandable.

Make these Pro benefits prominent on the pricing page:
- Access to the founder and CEO recipient database.
- Advanced follow-up emails.
- Higher daily auto-application and cold-email limits.
- Advanced application analytics.
- Higher fair-use allowance for resume building and AI tailoring.

Do not exaggerate or advertise database access or features that are not actually implemented.

# 3. Update pricing throughout the application

Inspect the entire codebase and update all old plan names, prices, limits, and references.

Update:
- Landing page pricing sections.
- Pricing page.
- Signup and onboarding pages.
- Dashboard subscription information.
- Subscription management page.
- Checkout plan selection.
- Upgrade and downgrade flows.
- Payment success and cancellation pages.
- FAQ and marketing copy.
- Backend plan configuration.
- Database plan records and seed data, where applicable.
- Usage-limit calculations and feature access checks.

Remove:
- Free plan references.
- Lite plan references.
- Old prices.
- Old daily limits.
- Outdated plan comparisons.

Make sure the pricing is consistent everywhere.

# 4. Dodo Payments — credentials and setup

Inspect the existing Dodo Payments integration before changing anything.

Use the current official Dodo Payments documentation and SDK. Do not use deprecated payment-link approaches if checkout sessions are the supported approach.

## Credentials required from the owner

Identify which credentials and configuration values are required for the existing integration.

At minimum, inspect whether the application needs:

1. Dodo Payments API key.
2. Dodo Payments webhook signing secret.
3. Dodo Payments environment or mode (test or live).
4. Dodo Payments product IDs for Basic Weekly, Basic Monthly, Pro Weekly, and Pro Monthly.
5. Any additional required configuration supported by the current Dodo integration.

Do not assume the exact environment variable names. Inspect the current code and official SDK documentation, then provide the exact names expected by the application.

**Important security requirements:**
- Do not ask the owner to paste secret API keys into chat.
- Do not put API keys or webhook secrets in frontend code.
- Do not use `NEXT_PUBLIC_` for secret credentials.
- Do not commit secrets to Git.
- Add appropriate placeholders to `.env.example`, never real credentials.
- Configure actual credentials through Vercel environment variables or a secure local `.env.local` file.
- Never print secret values in logs, reports, screenshots, or error messages.

If credentials are missing, stop before live checkout activation and provide a clear list of the exact values the owner needs to configure.

## Dodo product configuration

The following four recurring products must exist in Dodo:

| Product | Billing | Price |
|---|---|---:|
| Basic Weekly | Weekly | $5 |
| Basic Monthly | Monthly | $12 |
| Pro Weekly | Weekly | $11 |
| Pro Monthly | Monthly | $24 |

Use actual product IDs from the Dodo dashboard.

Do not invent product IDs or hardcode placeholder IDs as production values.

If these products do not exist:
- Explain which products must be created.
- Provide the exact product names, amounts, currency, billing intervals, and tax-inclusive pricing requirements.
- Ask the owner to supply the resulting product IDs through secure configuration.

Keep product mapping server-side. Users must not be able to submit arbitrary product IDs or manipulate checkout prices from the browser.

# 5. Checkout and subscription lifecycle

Implement or update the existing checkout flow so that:

- Users must be authenticated before starting checkout.
- The selected plan and billing interval are validated server-side.
- The server maps the selection to the correct Dodo product ID.
- Checkout uses the supported Dodo checkout-session integration.
- The user is redirected to the hosted checkout securely.
- Successful payment is confirmed through a verified webhook.
- A redirect to the success page alone never grants subscription access.

Preserve and verify:
- Webhook signature verification.
- Idempotent webhook processing.
- Duplicate event protection.
- Subscription renewals.
- Cancellation handling.
- Expiration handling.
- Subscription status synchronization.
- Customer portal functionality, if already implemented.

Do not weaken existing security or delete existing subscription records.

# 6. Subscription access and enforcement

- Users can register and log in without paying.
- An active paid subscription is required to access paid dashboard features.
- Users without an active subscription should be directed to pricing or subscription management.
- Cancelled subscriptions retain access until the paid period expires, according to the verified subscription status.
- Expired subscriptions lose paid access.
- All access checks must be enforced server-side.

Enforce usage limits server-side:

**Basic**
- 10 successful auto-applications per day.
- 15 successful cold emails per day.
- Own recipient list only.
- Basic follow-ups.
- Full tracker without advanced analytics.

**Pro**
- 20 successful auto-applications per day.
- 20 successful cold emails per day.
- Own recipient list plus founder/CEO database.
- Advanced follow-ups.
- Full tracker with analytics.

Prevent concurrent requests from exceeding limits. Count completed actions rather than failed attempts.

# 7. Pricing page design

Create a clear, polished comparison of Basic and Pro.

Include a billing interval switch between Weekly and Monthly.

Display:

**Basic**
- $5 weekly
- $12 monthly

**Pro**
- $11 weekly
- $24 monthly

Show a clear label such as **Taxes included** beside the prices.

Make Pro's additional value obvious, particularly the founder/CEO database and advanced follow-ups.

Do not make misleading claims about unlimited use. Explain fair-use policies clearly without inventing limits.

# 8. Preserve the existing infrastructure

This is an existing hosted application.

- Keep the existing Next.js architecture.
- Keep the existing Supabase project and authentication.
- Keep the existing Vercel project.
- Preserve user accounts and data.
- Preserve existing working functionality.
- Do not create duplicate database tables.
- Do not replace existing payment infrastructure unnecessarily.
- Do not change domains or DNS.
- Do not switch production to live payment mode without explicit approval.

Inspect the existing codebase, database schema, and environment configuration before making changes.

# 9. Testing and deployment

Start with Dodo test mode.

Test:
- Basic Weekly checkout.
- Basic Monthly checkout.
- Pro Weekly checkout.
- Pro Monthly checkout.
- Correct displayed and charged totals.
- Tax-inclusive checkout behavior.
- Successful payments.
- Failed payments.
- Duplicate and invalid webhooks.
- Renewals and cancellations.
- Subscription expiration.
- Basic and Pro access restrictions.
- Daily usage limits.
- Founder/CEO database restrictions.
- Existing user accounts and subscriptions.

Run:

`npx tsc --noEmit`

`npm run build`

Use a Vercel Preview deployment for testing. Do not deploy untested changes directly to production.

# 10. Final report and owner action required

When implementation is complete, report:

1. Pricing and plan changes made.
2. Files and components modified.
3. Database changes or migrations.
4. Dodo integration changes.
5. Exact environment variable names required.
6. Which Dodo product IDs are missing.
7. Whether tax-inclusive checkout totals have been verified.
8. Test results.
9. Build results.
10. Preview deployment URL.
11. Exact remaining actions required from the owner.

If credentials or product IDs are missing, clearly identify them and leave the integration safely configured but inactive until supplied.

**Final instruction:** Implement the new $5/$12 Basic and $11/$24 Pro pricing throughout Octo.tech. All prices are tax-inclusive. Preserve weekly billing, existing infrastructure, and the existing subscription lifecycle. Do not enable live payments until the owner has supplied the required credentials and approved the live deployment.