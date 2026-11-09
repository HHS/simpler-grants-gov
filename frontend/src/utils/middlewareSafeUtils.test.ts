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

  it.each([
    [
      { host: "grantee2.teams.simpler.grants.gov" },
      "https://grantee2.teams.simpler.grants.gov",
    ],
    [{}, "https://0.0.0.0:8000"],
  ])("redacts the token query param with headers %p", (headers, origin) => {
    const resolve = (pathAndQuery: string) =>
      resolveExternalRequestUrl(
        buildRequest(`https://0.0.0.0:8000${pathAndQuery}`, headers),
      );

    expect(resolve("/api/auth/callback?token=raw.login.jwt")).toBe(
      `${origin}/api/auth/callback?token=REDACTED`,
    );
    expect(resolve("/api/auth/callback/?token=raw.login.jwt")).toBe(
      `${origin}/api/auth/callback/?token=REDACTED`,
    );
    expect(resolve("/some/future/path?token=raw.login.jwt")).toBe(
      `${origin}/some/future/path?token=REDACTED`,
    );
    expect(resolve("/search?query=test&token=raw.login.jwt&page=2")).toBe(
      `${origin}/search?query=test&token=REDACTED&page=2`,
    );
  });

  it("never includes the raw token in the resolved URL", () => {
    const url = resolveExternalRequestUrl(
      buildRequest(
        "https://0.0.0.0:8000/api/auth/callback?token=raw.login.jwt&token=second.jwt",
        { host: "grantee2.teams.simpler.grants.gov" },
      ),
    );

    expect(url).not.toContain("raw.login.jwt");
    expect(url).not.toContain("second.jwt");
  });

  it("leaves a URL without a token param unchanged", () => {
    expect(
      resolveExternalRequestUrl(
        buildRequest(
          "https://0.0.0.0:8000/search?query=test&tokens=kept&status=forecasted",
          { host: "grantee2.teams.simpler.grants.gov" },
        ),
      ),
    ).toBe(
      "https://grantee2.teams.simpler.grants.gov/search?query=test&tokens=kept&status=forecasted",
    );
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
