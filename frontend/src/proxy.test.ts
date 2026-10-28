/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from "next/server";

import proxy from "./proxy";

jest.mock("next-intl/middleware", () => () => () => NextResponse.next());

jest.mock("src/services/logger/simplerLogger", () => ({
  logger: { info: jest.fn() },
  logRequest: jest.fn(),
}));

const PRIVATE_NO_STORE = "private, no-store, max-age=0";
const NOINDEX = "noindex, nofollow";

const requestFor = (pathname: string, signedIn = false) =>
  new NextRequest(`http://localhost:3000${pathname}`, {
    headers: signedIn ? { cookie: "session=fake-session" } : {},
  });

describe("proxy cache and index headers", () => {
  const authGatedPaths = [
    "/workspace",
    "/workspace/applications",
    "/workspace/saved-opportunities",
    "/settings",
    "/notifications",
    "/grantor",
    "/grantor/opportunities",
    "/developers/api-dashboard",
    "/developers/api-dashboard/keys",
    "/es/workspace",
    "/es/grantor/opportunities",
  ];

  describe.each([
    ["signed out", false],
    ["signed in", true],
  ])("auth-gated routes, %s", (_label, signedIn) => {
    it.each(authGatedPaths)("marks %p private and noindex", (pathname) => {
      const response = proxy(requestFor(pathname, signedIn));
      expect(response.headers.get("Cache-Control")).toBe(PRIVATE_NO_STORE);
      expect(response.headers.get("X-Robots-Tag")).toBe(NOINDEX);
    });
  });

  const publicPaths = [
    "/search",
    "/opportunity/123",
    "/",
    "/developers",
    "/workspace-foo",
    "/settingsfoo",
    "/developers/api-dashboard-foo",
    "/grantors",
    "/es/search",
    "/search/workspace",
  ];

  it.each(publicPaths)(
    "leaves signed-out %p to the next.config cache rules",
    (pathname) => {
      const response = proxy(requestFor(pathname));
      expect(response.headers.get("Cache-Control")).toBeNull();
      expect(response.headers.get("X-Robots-Tag")).toBeNull();
    },
  );

  it.each(publicPaths)("keeps signed-in %p no-store", (pathname) => {
    const response = proxy(requestFor(pathname, true));
    expect(response.headers.get("Cache-Control")).toBe("no-store, max-age=0");
    expect(response.headers.get("X-Robots-Tag")).toBeNull();
  });

  it("treats an empty session cookie as signed out", () => {
    const response = proxy(
      new NextRequest("http://localhost:3000/search", {
        headers: { cookie: "session=" },
      }),
    );
    expect(response.headers.get("Cache-Control")).toBeNull();
  });
});
