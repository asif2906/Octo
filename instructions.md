# OCTO.TECH — PHASE 3
# DODO PAYMENTS INTEGRATION, SUBSCRIPTIONS & PRODUCTION DEPLOYMENT

You are a senior full-stack engineer specializing in Next.js 16, React 19, TypeScript, Supabase, PostgreSQL, Vercel and Dodo Payments.

You are continuing development of an EXISTING, DEPLOYED SaaS application.

Your task is to integrate Dodo Payments into Octo.tech, implement subscription management, enforce paid access, and test the complete billing lifecycle.

## 1. EXISTING PROJECT INFORMATION

**Live website:**
https://octo-pi-nine.vercel.app/

**Hosting:** Vercel

**Database and authentication:** Supabase

**Payments:** Dodo Payments (to be integrated)

**Framework:** Next.js 16 App Router

**Language:** TypeScript

IMPORTANT:

The website is already deployed and Supabase is already connected.

DO NOT:
- Create a new Next.js project.
- Create a new Vercel project.
- Create a new Supabase project.
- Replace existing authentication.
- Replace the existing database.
- Rebuild the landing page from scratch.
- Disconnect the existing Git repository from Vercel.
- Overwrite existing environment variables unnecessarily.

First inspect the existing repository and understand the current architecture.

Work directly in the existing project.

All changes must preserve existing functionality.

## 2. UPDATED BUSINESS MODEL

Octo.tech has changed its subscription model.

There is NO FREE PLAN.

There are three paid subscription tiers:

| Plan | Weekly | Monthly |
|---|---:|---:|
| Lite | $2 | $5 |
| Basic | $4 | $9 |
| Pro | $7 | $19 |

All prices are in USD.

### Plan limits

| Feature | Lite | Basic | Pro |
|---|---:|---:|---:|
| Auto-apply/day | 5 | 10 | 20 |
| Cold emails/day | 5 | 15 | 20 |
| Resume builder | Yes | Yes | Yes |
| AI tailoring | Yes | Yes | Yes |
| Application tracker | Yes | Yes | Yes |
| Follow-ups | Basic | Advanced | Advanced |
| Analytics | Basic | Full | Advanced |

No credits.

No free tier.

Only daily usage limits and subscription billing intervals.

Users can register without paying, but they must purchase a subscription before accessing the paid dashboard.

## 3. UPDATE THE EXISTING WEBSITE

Before implementing payments, update the existing public-facing website.

The current deployed landing page still contains the old Free, Basic and Pro pricing model.

Replace all outdated pricing information.

Update:

- Landing page pricing section.
- Pricing page.
- Signup messaging.
- Login redirects where appropriate.
- Dashboard subscription page.
- Subscription upgrade prompts.
- FAQ.
- Any references to free-tier limits.

The pricing page must show:

**Lite**
- $2 weekly.
- $5 monthly.
- 5 applications/day.
- 5 cold emails/day.

**Basic**
- $4 weekly.
- $9 monthly.
- 10 applications/day.
- 15 cold emails/day.

**Pro**
- $7 weekly.
- $19 monthly.
- 20 applications/day.
- 20 cold emails/day.

Include a working weekly/monthly toggle.

Prices must come from a single central configuration.

Do not hardcode different prices in multiple components.

Design the pricing section to match the existing Octo.tech design system.

Do not introduce a completely different visual style.

Remove statements such as:
- Start free.
- Free plan included.
- No card required.
- $0/month.

Replace them with accurate subscription information.

## 4. VERCEL AND SUPABASE ENVIRONMENT

The existing application is hosted on Vercel and already connected to Supabase.

Preserve those connections.

Inspect the existing environment variables before making changes.

Use the existing Supabase URL and public key.

Do not replace working Supabase credentials.

Add the Dodo environment variables through the appropriate environment configuration.

Required variables:

```env
DODO_PAYMENTS_API_KEY=
DODO_PAYMENTS_WEBHOOK_SECRET=
DODO_PAYMENTS_ENVIRONMENT=test_mode

NEXT_PUBLIC_APP_URL=https://octo-pi-nine.vercel.app

DODO_LITE_WEEKLY_PRODUCT_ID=
DODO_LITE_MONTHLY_PRODUCT_ID=

DODO_BASIC_WEEKLY_PRODUCT_ID=
DODO_BASIC_MONTHLY_PRODUCT_ID=

DODO_PRO_WEEKLY_PRODUCT_ID=
DODO_PRO_MONTHLY_PRODUCT_ID=
```

Use the actual environment variable names required by the selected Dodo SDK version.

IMPORTANT:

- Configure variables in Vercel Project Settings.
- Use Preview and Development environments for testing.
- Keep production configuration separate.
- Do not expose Dodo secret keys to the browser.
- Never commit `.env.local`.
- Do not overwrite existing Supabase variables.
- Do not switch to Dodo live mode without explicit approval.

If credentials are missing, explain exactly what I need to configure.

Do not fabricate credentials or product IDs.

## 5. DODO PAYMENTS SETUP

Use official documentation:

https://docs.dodopayments.com/

Official Next.js adapter:

https://www.npmjs.com/package/@dodopayments/nextjs

Official SDK:

https://www.npmjs.com/package/dodopayments

Before implementation, verify the latest official API methods, webhook events, checkout creation flow and subscription management methods.

Use hosted Checkout Sessions.

Do not use deprecated payment link patterns.

Create six recurring products in the Dodo dashboard:

1. Lite Weekly — $2.
2. Lite Monthly — $5.
3. Basic Weekly — $4.
4. Basic Monthly — $9.
5. Pro Weekly — $7.
6. Pro Monthly — $19.

Configure the correct recurring intervals.

Use the actual Dodo product IDs.

Map product IDs to plans using trusted server-side configuration.

The client must never be allowed to supply an arbitrary product ID or price.

## 6. CHECKOUT IMPLEMENTATION

Implement secure checkout endpoints.

Suggested structure:

```text
app/
  api/
    payments/
      checkout/
        route.ts
      portal/
        route.ts
    webhooks/
      dodo/
        route.ts

  payment/
    success/
      page.tsx
    cancel/
      page.tsx
```

Checkout workflow:

1. User signs up or logs in.
2. User visits pricing.
3. User chooses a subscription plan.
4. User chooses weekly or monthly billing.
5. User clicks Subscribe.
6. Server authenticates the Supabase user.
7. Server validates the selected plan and interval.
8. Server retrieves the corresponding Dodo product ID.
9. Server creates a hosted Checkout Session.
10. User is redirected to Dodo.
11. User completes checkout.
12. Dodo redirects the user to Octo.tech.
13. Verified webhook confirms the subscription.
14. Supabase is updated.
15. User receives access to the correct subscription tier.

Use the authenticated Supabase user's ID as the trusted customer reference or metadata supported by Dodo.

Never trust a user ID supplied by the browser when activating a subscription.

A successful redirect must NOT automatically activate a subscription.

Only verified Dodo events can grant access.

## 7. SUPABASE DATABASE INTEGRATION

Inspect the existing Supabase schema first.

Create migrations only for missing functionality.

Create or extend the following tables.

### subscriptions

- id
- user_id
- dodo_customer_id
- dodo_subscription_id
- dodo_product_id
- plan
- billing_interval
- status
- current_period_start
- current_period_end
- cancel_at_period_end
- cancelled_at
- created_at
- updated_at

### payment_history

- id
- user_id
- dodo_payment_id
- dodo_subscription_id
- amount
- currency
- payment_status
- payment_type
- created_at

### dodo_webhook_events

- id
- webhook_id
- event_type
- processed
- processed_at
- created_at

Use appropriate:

- Foreign keys.
- Unique constraints.
- Indexes.
- Database migrations.
- RLS policies.

Users can read only their own subscriptions and payment history.

Users cannot manually change their plan or subscription status.

Only trusted server-side webhook processing can update billing records.

Never expose Supabase service-role credentials.

If using Supabase RPC or database functions, secure them appropriately.

## 8. WEBHOOK IMPLEMENTATION

Implement Dodo's official signature verification.

Verify the current official event names and payload structures before writing handlers.

Handle the relevant lifecycle events:

- Subscription activated.
- Subscription renewed.
- Subscription updated.
- Subscription plan changed.
- Subscription placed on hold.
- Subscription cancelled.
- Subscription expired.
- Payment succeeded.
- Payment failed.
- Payment processing.

Use the exact event identifiers from the current Dodo documentation.

Webhook requirements:

- Verify signatures.
- Reject invalid signatures.
- Handle duplicate events.
- Implement idempotency.
- Handle out-of-order events.
- Record processing errors.
- Never activate subscriptions from unverified requests.
- Do not trust browser redirects.

Use a unique webhook event ID to prevent duplicate processing.

Ensure webhook processing is safe if the same event arrives multiple times.

## 9. SUBSCRIPTION ACCESS CONTROL

Implement server-side subscription verification.

Remove all old Free-plan entitlement logic.

Access policy:

| Status | Access |
|---|---|
| Active | Access according to plan |
| Pending | No paid access |
| On hold | Apply billing recovery policy |
| Cancelled but paid period remains | Access until period ends |
| Expired | No paid access |
| No subscription | Redirect to pricing |

Protect:

- `/dashboard`
- `/dashboard/resumes`
- `/dashboard/applications`
- `/dashboard/outreach`
- `/dashboard/follow-ups`
- `/dashboard/profile`
- `/dashboard/subscription`

Keep these accessible:

- `/`
- `/pricing`
- `/login`
- `/signup`
- `/auth/callback`
- `/payment/success`
- `/payment/cancel`
- `/privacy`
- `/terms`

Preserve the existing Supabase proxy and authentication patterns.

Implement subscription checks on the server.

Do not rely solely on client-side route guards.

Prevent redirect loops.

Allow users without subscriptions to access pricing and payment pages.

## 10. PLAN LIMIT ENFORCEMENT

Create one central plan configuration.

```typescript
export const PLAN_LIMITS = {
  lite: {
    applicationsPerDay: 5,
    emailsPerDay: 5,
  },
  basic: {
    applicationsPerDay: 10,
    emailsPerDay: 15,
  },
  pro: {
    applicationsPerDay: 20,
    emailsPerDay: 20,
  },
} as const
```

Use this configuration throughout the application.

Enforce limits on the server.

Prevent users from bypassing limits through direct API calls or concurrent requests.

Only count successfully completed actions.

Use atomic database operations where needed.

Do not allow client-side plan changes to affect entitlements.

## 11. SUBSCRIPTION MANAGEMENT

Update:

`app/dashboard/subscription/page.tsx`

Display:

- Current subscription.
- Current plan.
- Billing interval.
- Current price.
- Subscription status.
- Current billing period.
- Next renewal date.
- Cancellation information.
- Payment history.

Provide:

- Change Plan.
- Manage Billing.
- Cancel Subscription.

Use Dodo's official Customer Portal.

Create portal sessions server-side after verifying the authenticated user's customer ID.

Do not accept arbitrary Dodo customer IDs from the client.

For plan changes, use officially supported Dodo subscription update methods.

Explain the effective date and any applicable price changes before confirmation.

Do not invent proration calculations.

Update application entitlements only after verified subscription changes.

## 12. PAYMENT SUCCESS AND CANCEL PAGES

Success page:

`/payment/success`

Display:

"Your payment is being confirmed."

The page must check the application's subscription status using a secure server-side endpoint.

Do not activate subscriptions from the success page.

When the webhook confirms the subscription, show:

"Welcome to Octo.tech!"

Provide a button to access the dashboard.

Cancel page:

`/payment/cancel`

Display:

"Checkout was cancelled."

Allow the user to return to pricing.

Do not create a subscription when checkout is cancelled.

## 13. TESTING

Use Dodo TEST MODE.

Test all six products.

### Lite

- Weekly: $2.
- Monthly: $5.
- 5 applications/day.
- 5 emails/day.

### Basic

- Weekly: $4.
- Monthly: $9.
- 10 applications/day.
- 15 emails/day.

### Pro

- Weekly: $7.
- Monthly: $19.
- 20 applications/day.
- 20 emails/day.

Test:

1. Successful checkout.
2. Failed payment.
3. Invalid webhook signature.
4. Duplicate webhook.
5. Subscription activation.
6. Subscription renewal.
7. Subscription cancellation.
8. Subscription expiration.
9. Plan upgrade.
10. Plan downgrade.
11. Weekly-to-monthly change.
12. Monthly-to-weekly change.
13. Unpaid dashboard access.
14. Server-side usage enforcement.
15. Customer Portal.

Test both localhost and the Vercel Preview deployment.

Use actual signed webhook deliveries, not just mocked success responses.

Do not process real customer payments during testing.

## 14. VERCEL DEPLOYMENT

The project is already deployed at:

https://octo-pi-nine.vercel.app/

Preserve the existing Vercel project and deployment configuration.

Development workflow:

1. Inspect the existing Git repository.
2. Create a separate feature branch if appropriate.
3. Implement Dodo integration.
4. Run TypeScript checks.
5. Run production build.
6. Test locally.
7. Push changes to the connected repository.
8. Verify the Vercel Preview deployment.
9. Configure Dodo test webhooks to reach the Preview deployment.
10. Test the complete checkout and webhook lifecycle.
11. Fix any deployment-specific issues.

Do not overwrite production with untested code.

Do not modify DNS or custom domain configuration.

Do not expose production secrets in logs or client-side code.

Only deploy the verified implementation to production when approved.

## 15. PRODUCTION CHECKLIST

Before declaring completion:

- Existing Supabase authentication works.
- Existing user records are preserved.
- Existing resumes are preserved.
- Existing applications are preserved.
- All six Dodo products are correctly mapped.
- Weekly and monthly checkout works.
- Webhook signatures are verified.
- Duplicate events are handled.
- Subscriptions persist in Supabase.
- Access is granted only after verified activation.
- Usage limits are enforced server-side.
- Cancellation works correctly.
- Renewal works correctly.
- Payment history is accurate.
- Customer Portal works.
- No secrets are exposed.
- No old Free-plan references remain.
- Vercel production build succeeds.

Run:

```bash
npx tsc --noEmit
npm run build
```

Fix relevant errors before declaring completion.

## 16. FINAL REPORT

Provide:

1. Files created.
2. Files modified.
3. Existing functionality preserved.
4. Supabase migrations created.
5. Dodo dependencies installed.
6. Environment variables configured.
7. Dodo products configured.
8. Webhook endpoint configured.
9. Test results for each plan.
10. Test results for each billing interval.
11. Subscription lifecycle test results.
12. Security measures.
13. Vercel Preview deployment URL.
14. Production deployment status.
15. Remaining manual configuration.

Clearly distinguish implemented, tested, and pending functionality.

Do not claim successful payments when only test mode was used.

Do not switch to live payments without my approval.

# FINAL OBJECTIVE

Integrate Dodo Payments into the existing hosted Octo.tech application without rebuilding it.

The final product must have:

- Three paid plans.
- Weekly and monthly billing.
- Six recurring Dodo products.
- Secure hosted checkout.
- Verified webhooks.
- Subscription lifecycle management.
- Customer Portal.
- Supabase subscription persistence.
- Server-side plan enforcement.
- Proper cancellation and renewal handling.
- Working Vercel deployment.

**The existing application is the foundation. Extend it, secure it, test it and deploy it carefully. Do not start over.**