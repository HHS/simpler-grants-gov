import { getNextRoutes } from "src/utils/getRoutes";

// TODO: https://github.com/navapbc/simpler-grants-gov/issues/98
// Need to move listPaths to a different file and mock it in order to make this more isolated

describe("getNextRoutes", () => {
  it("should get Next.js routes from src directory", () => {
    const result = getNextRoutes("src/app");

    expect(result).toEqual([
      "/dev/feature-flags",
      "/developer",
      "/error",
      "/events",
      "/login",
      "/maintenance",
      "/opportunity/1",
      "/",
      "/print/application/[applicationId]/form/[appFormId]",
      "/roadmap",
      "/saved-opportunities",
      "/saved-search-queries",
      "/search",
      "/subscribe/confirmation",
      "/subscribe",
      "/subscribe/unsubscribe",
      "/unauthenticated",
      "/vision",
      "/workspace/applications/application/[applicationId]/form/[appFormId]",
      "/workspace/applications/application/[applicationId]/form/[appFormId]/success",
      "/workspace/applications/application/[applicationId]",
    ]);
  });
});
