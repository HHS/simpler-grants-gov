# Newsletter Subscription — API Route & Testing

## Overview

This directory contains the Next.js API route handler for newsletter subscriptions (`POST /api/newsletter/subscribe`). It was introduced to replace a direct server-action-to-Sendy pattern that made E2E testing unreliable.

---

## Problem It Solves (Issue [#5152](https://github.com/HHS/simpler-grants-gov/issues/5152))

The original implementation used a Next.js server action (`actions.tsx`) to call the Sendy API directly from the server. This had two key problems:

1. **Playwright's `page.route()` cannot intercept server-side `fetch` calls** — it only intercepts browser-initiated requests. This made it impossible to mock the Sendy service in E2E tests.
2. **`next/experimental/testmode`** (the previous workaround) was unreliable in CI staging environments.

**Solution:** Move the Sendy call into a browser-visible Next.js API route (`/api/newsletter/subscribe`). The `SubscriptionForm` component now POSTs to this route from the browser, allowing Playwright to intercept and mock it reliably with `page.route("**/api/newsletter/subscribe", ...)`.

---

## Files Changed

| File | Change |
|---|---|
| `src/app/api/newsletter/subscribe/route.ts` | **New** — Next.js API route that validates form data and proxies to Sendy |
| `src/components/newsletter/SubscriptionForm.tsx` | **Modified** — Refactored from `useFormState` + server action to `useState` + `fetch("/api/newsletter/subscribe")` |
| `src/components/newsletter/SubscriptionForm.test.tsx` | **Modified** — Updated unit tests to mock `global.fetch` instead of the server action |
| `tests/e2e/subscribe.spec.ts` | **Modified** — Rewrote E2E tests using `page.route()` to mock the API route; removed `next/experimental/testmode` dependency |

---

## API Route: `POST /api/newsletter/subscribe`

### Request

`Content-Type: multipart/form-data`

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | Yes | Subscriber's first name |
| `LastName` | string | No | Subscriber's last name |
| `email` | string | Yes | Subscriber's email address |
| `hp` | string | No | Honeypot field (spam prevention) |

### Response

**Success (`200`)**
```json
{ "success": true }
```

**Already subscribed (`200`)**
```json
{ "success": false, "errorCode": "alreadySubscribed" }
```

**Validation error (`400`)**
```json
{
  "success": false,
  "validationErrors": {
    "name": ["String must contain at least 1 character(s)"],
    "email": ["Invalid email"]
  }
}
```

**Server/Sendy error (`500`)**
```json
{ "success": false, "errorCode": "server" }
```

---

## Environment Variables Required

These must be set for the route to function. For local development, add them to `frontend/.env.local`:

```bash
SENDY_API_URL=https://your-sendy-instance.com
SENDY_API_KEY=your_api_key
SENDY_LIST_ID=your_list_id
```

Contact a team engineer to obtain the actual secret values. See [documentation/frontend/development.md](../../../../../documentation/frontend/development.md#new-relic-and-sendy-email) for more details.

The variables are already wired up in:
- `frontend/src/constants/environments.ts` — reads from `process.env`
- `frontend/Dockerfile` — passed as `ARG`/`ENV` at Docker build time
- `infra/frontend/app-config/env-config/environment_variables.tf` — managed via Terraform for deployed environments

---

## Validation

The route uses [zod](https://zod.dev/) (already a project dependency at `^3.23.8`) to validate `name` and `email` before proxying to Sendy.

---

## E2E Testing

Tests are in `frontend/tests/e2e/subscribe.spec.ts`. They use `page.route()` to intercept `**/api/newsletter/subscribe` without hitting the real Sendy service:

```ts
// Mock a successful subscription
await page.route("**/api/newsletter/subscribe", (route) =>
  route.fulfill({ status: 200, body: JSON.stringify({ success: true }) })
);

// Mock a server error
await page.route("**/api/newsletter/subscribe", (route) =>
  route.fulfill({ status: 500, body: JSON.stringify({ success: false, errorCode: "server" }) })
);
```

---

## Unit Testing

Unit tests are in `frontend/src/components/newsletter/SubscriptionForm.test.tsx`. They mock `global.fetch` to simulate API responses:

```ts
global.fetch = jest.fn().mockResolvedValue({
  json: async () => ({ success: true }),
});
```
