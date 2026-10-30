/**
 * @feature Cache and index headers
 * @featureFile e2e/cache-headers/features/auth-gated-cache-headers.feature
 * @scenario Auth-gated pages are private and noindex whether signed in or signed out
 * @scenario Signed-out public pages keep their public cache policy
 * @scenario Signed-in public pages are not stored
 * @scenario Old saved and applications paths land on private workspace pages
 */

import { APIResponse, expect, test } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";

const { FULL_REGRESSION } = VALID_TAGS;
const { targetEnv } = playwrightEnv;

const PRIVATE_NO_STORE = "private, no-store, max-age=0";
const NOINDEX = "noindex, nofollow";
// the proxy only checks that a non-empty session cookie is present
const SESSION_COOKIE = { Cookie: "session=cache-header-test" };

// origin headers only; final CDN headers are verified against deployed environments
test.skip(targetEnv !== "local", "Origin header checks run against local only");

const expectPrivateNoindex = (response: APIResponse) => {
  expect(response.headers()["cache-control"]).toBe(PRIVATE_NO_STORE);
  expect(response.headers()["x-robots-tag"]).toBe(NOINDEX);
};

test.describe("auth-gated pages", () => {
  const authGatedPaths = [
    "/workspace",
    "/workspace/applications",
    "/settings",
    "/notifications",
    "/developers/api-dashboard",
  ];

  for (const [label, headers] of [
    ["signed out", {}],
    ["signed in", SESSION_COOKIE],
  ] as const) {
    test(
      `are private and noindex when ${label}`,
      { tag: [FULL_REGRESSION] },
      async ({ request }) => {
        for (const path of authGatedPaths) {
          const response = await request.get(path, { headers });
          expect(response.status(), path).toBe(200);
          expectPrivateNoindex(response);
        }
      },
    );
  }

  test(
    "near-prefix paths do not get the auth-gated policy",
    { tag: [FULL_REGRESSION] },
    async ({ request }) => {
      for (const path of ["/workspace-foo", "/developers"]) {
        const response = await request.get(path);
        expect(response.headers()["cache-control"], path).not.toContain(
          "private",
        );
        expect(response.headers()["x-robots-tag"], path).toBeUndefined();
      }
    },
  );

  test(
    "old saved and applications paths redirect to private workspace pages",
    { tag: [FULL_REGRESSION] },
    async ({ request }) => {
      for (const [path, destination] of [
        ["/applications", "/workspace/applications"],
        ["/saved-opportunities", "/workspace/saved-opportunities"],
      ]) {
        const response = await request.get(path);
        expect(new URL(response.url()).pathname).toBe(destination);
        expectPrivateNoindex(response);
      }
    },
  );
});

test.describe("public pages", () => {
  const publicCachePolicies = {
    "/search": "s-maxage=3600, stale-while-revalidate=60, stale-if-error=300",
    "/opportunity/123":
      "s-maxage=600, stale-while-revalidate=60, stale-if-error=300",
  };

  test(
    "keep public caching when signed out",
    { tag: [FULL_REGRESSION] },
    async ({ request }) => {
      for (const [path, cacheControl] of Object.entries(publicCachePolicies)) {
        // an opportunity id may redirect or 404 depending on seed data; both carry the page policy
        const response = await request.get(path, { maxRedirects: 0 });
        expect(response.headers()["cache-control"], path).toBe(cacheControl);
        expect(response.headers()["x-robots-tag"], path).toBeUndefined();
      }
    },
  );

  test(
    "are not stored when signed in",
    { tag: [FULL_REGRESSION] },
    async ({ request }) => {
      for (const path of Object.keys(publicCachePolicies)) {
        const response = await request.get(path, {
          headers: SESSION_COOKIE,
          maxRedirects: 0,
        });
        expect(response.headers()["cache-control"], path).toBe(
          "no-store, max-age=0",
        );
        expect(response.headers()["x-robots-tag"], path).toBeUndefined();
      }
    },
  );
});
