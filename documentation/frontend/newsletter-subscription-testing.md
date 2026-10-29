# Testing newsletter subscription (Mailchimp) locally

The `/newsletter` signup form posts to the `POST /api/newsletter/subscribe`
route, which subscribes the user to a Mailchimp audience using Mailchimp's
[batch subscribe endpoint](https://mailchimp.com/developer/marketing/api/lists/).
This runbook covers verifying that integration locally against a real Mailchimp
audience.

## Prerequisites

- Access to the shared Mailchimp admin account.
- The Mailchimp API key, data center prefix (`us4`), and the **lower-env**
  audience (list) ID. Get these from 1Password / the team — do not use the prod
  audience id for local testing.

## Configure environment variables

These are secrets, so they go in `frontend/.env.local`, which is gitignored.
**Never put them in `.env.development` or `.env.local.example`** — those files
are tracked in git.

Add the following to `frontend/.env.local`:

```
MAILCHIMP_API_KEY=<api key>
MAILCHIMP_API_URL_PREFIX=us4
MAILCHIMP_LIST_ID=<lower-env audience id>
```

These map to [environments.ts](../../frontend/src/constants/environments.ts) and
are read by the route at
[frontend/src/app/api/newsletter/subscribe/route.ts](../../frontend/src/app/api/newsletter/subscribe/route.ts).

## Start the dev server

```bash
cd frontend
npm run dev
```

The server runs at http://localhost:3000.

## Option A — test through the UI

1. Open http://localhost:3000/newsletter.
2. Submit the form empty → you should see "Please enter a name." and
   "Please enter an email address." (client-side validation).
3. Fill in a first name and a **real-domain** email you control (see the note on
   email validity below), then submit → you're redirected to
   `/newsletter/confirmation` ("You're subscribed").
4. Submit the same email again → you see "This email address has already been
   subscribed."
5. Confirm the contact (with first/last name) appears in the audience in the
   Mailchimp dashboard.

## Option B — test the API route directly with curl

This is the fastest way to exercise the route → Mailchimp integration without a
browser. Use a unique, real-domain email each run (e.g. a `+alias` of your own).

```bash
EMAIL="you+mctest$RANDOM@yourdomain.com"

# 1. Fresh subscribe -> expect: {"success":true}  HTTP 200
curl -s -w "\nHTTP %{http_code}\n" -X POST http://localhost:3000/api/newsletter/subscribe \
  -F "name=Test" -F "LastName=User" -F "email=$EMAIL"

# 2. Duplicate -> expect: {"success":false,"errorCode":"alreadySubscribed"}  HTTP 200
curl -s -w "\nHTTP %{http_code}\n" -X POST http://localhost:3000/api/newsletter/subscribe \
  -F "name=Test" -F "LastName=User" -F "email=$EMAIL"

# 3. Missing fields -> expect: validationErrors  HTTP 400
curl -s -w "\nHTTP %{http_code}\n" -X POST http://localhost:3000/api/newsletter/subscribe \
  -F "name=" -F "email="
```

### Expected response contract

| Scenario | HTTP | Body |
|---|---|---|
| Success | 200 | `{"success":true}` |
| Already subscribed | 200 | `{"success":false,"errorCode":"alreadySubscribed"}` |
| Missing/invalid fields | 400 | `{"success":false,"validationErrors":{...}}` |
| Honeypot (`hp`) filled | 200 | `{"success":true}` (no Mailchimp call — spam absorbed) |
| Mailchimp/transport error | 500 | `{"success":false,"errorCode":"server"}` |

## Notes

- **Use a real-domain email.** Mailchimp rejects obviously fake addresses
  (e.g. anything `@example.com`) with `error_code: "ERROR_GENERIC"` and the
  message "looks fake or invalid". The route surfaces this as a 500
  `errorCode: "server"`. If you get an unexpected 500, check the dev server
  output for `Error subscribing user: ...`, or query Mailchimp directly to see
  the full `errors[].error` message:

  ```bash
  curl -s -X POST "https://us4.api.mailchimp.com/3.0/lists/<list_id>" \
    -u "anystring:<api_key>" \
    -H "Content-Type: application/json" \
    -d '{"members":[{"email_address":"you@yourdomain.com","status":"subscribed","merge_fields":{"FNAME":"Test","LNAME":"User"}}]}'
  ```

- **Already-subscribed detection** relies on Mailchimp's batch endpoint
  returning HTTP 200 with an `errors` array; an existing member yields
  `error_code: "ERROR_CONTACT_EXISTS"`.
- **Clean up** test contacts you create in the lower-env audience via the
  Mailchimp dashboard.
- The Playwright e2e spec
  ([subscribe.spec.ts](../../frontend/tests/e2e/subscribe/specs/subscribe.spec.ts))
  mocks `/api/newsletter/subscribe` and does **not** hit Mailchimp; use the steps
  above for real end-to-end verification.

## Unit tests

Route behavior (success, already-subscribed, Mailchimp errors, validation,
honeypot) is covered by
[route.test.ts](../../frontend/src/app/api/newsletter/subscribe/route.test.ts):

```bash
cd frontend
npx jest src/app/api/newsletter/subscribe/route.test.ts
```
