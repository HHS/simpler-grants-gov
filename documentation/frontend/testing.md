# Testing

## E2E testing

### Spoofing logins

There are situations where we want to be able to test a "logged in" experience without having to script the test through the full login flow. In order to support this we have built a system to spoof the user login by placing a session cookie into the browser context.

This system is based on a `createSpoofedSessionCookie` which will create a client side cookie on the browser context that will effectively log in a fake user with the API.

Using this function, tests should work automatically in CI, but they will require a bit of manual setup to work locally.

#### Local setup

- run `make db-seed-local` in the /api directory. This will create the necessary DB records for the spoofed user and spit out an API auth token in a file at /api/e2e_token.tmp.
- copy the token variable declaration from the e2e_token.tmp file into your frontend .env.local file
- that's it! Running e2e tests using the functionality mentioned above should now work locally
