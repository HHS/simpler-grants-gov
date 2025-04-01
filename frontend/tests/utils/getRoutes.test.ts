import { getNextRoutes } from "src/utils/getRoutes";

// TODO: https://github.com/navapbc/simpler-grants-gov/issues/98
// Need to move listPaths to a different file and mock it in order to make this more isolated

describe("getNextRoutes", () => {
  it("should get Next.js routes from src directory", () => {
    const result = getNextRoutes("src/app");

    expect(result).toEqual([
      "/dev/feature-flags",
      "/error",
      "/formPrototype/1",
      "/formPrototype/success",
      "/health",
      "/login",
      "/maintenance",
      "/opportunity/1",
      "/",
      "/research",
      "/roadmap",
      "/saved-grants",
      "/saved-search-queries",
      "/search",
      "/subscribe/confirmation",
      "/subscribe",
      "/subscribe/unsubscribe",
      "/unauthenticated",
      "/unauthorized",
    ]);
  });
});
