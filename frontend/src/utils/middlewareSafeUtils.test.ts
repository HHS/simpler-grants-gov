/**
 * @jest-environment node
 */

import { resolveExternalRequestUrl } from "src/utils/middlewareSafeUtils";

import { NextRequest } from "next/server";

const buildRequest = (
  url: string,
  headerEntries: Record<string, string> = {},
): NextRequest => new NextRequest(url, { headers: new Headers(headerEntries) });

describe("resolveExternalRequestUrl", () => {
  it("resolves the container-facing URL to the external URL, preserving path and query", () => {
    expect(
      resolveExternalRequestUrl(
        buildRequest("https://0.0.0.0:8000/search?query=test", {
          host: "grantee2.teams.simpler.grants.gov",
        }),
      ),
    ).toBe("https://grantee2.teams.simpler.grants.gov/search?query=test");
  });

  it("falls back to the request URL when there is no host header", () => {
    expect(
      resolveExternalRequestUrl(buildRequest("https://0.0.0.0:8000/search")),
    ).toBe("https://0.0.0.0:8000/search");
  });

  it("falls back to the request URL when the host header is not a hostname", () => {
    expect(
      resolveExternalRequestUrl(
        buildRequest("https://0.0.0.0:8000/search", {
          host: "grantee2.example.gov@evil.com",
        }),
      ),
    ).toBe("https://0.0.0.0:8000/search");
  });

  it("ignores x-forwarded-host when it disagrees with the host header", () => {
    expect(
      resolveExternalRequestUrl(
        buildRequest("https://0.0.0.0:8000/search", {
          host: "grantee2.teams.simpler.grants.gov",
          "x-forwarded-host": "evil.example.com",
        }),
      ),
    ).toBe("https://grantee2.teams.simpler.grants.gov/search");
  });
});
