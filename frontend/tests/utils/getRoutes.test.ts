import { getNextRoutes } from "src/utils/getRoutes";

// TODO: https://github.com/navapbc/simpler-grants-gov/issues/98
// Need to move listPaths to a different file and mock it in order to make this more isolated

describe("getNextRoutes", () => {
  it("should get Next.js routes from src directory", () => {
    const result = getNextRoutes("src/app");

    expect(result).toEqual([
      "/(base)/[...not-found]",
      "/(base)/api-dashboard",
      "/(base)/dev/feature-flags",
      "/(base)/developer",
      "/(base)/error",
      "/(base)/events",
      "/(base)/login",
      "/(base)/maintenance",
      "/(base)/opportunity/1",
      "/(base)",
      "/(base)/roadmap",
      "/(base)/saved-opportunities",
      "/(base)/saved-search-queries",
      "/(base)/search",
      "/(base)/subscribe/confirmation",
      "/(base)/subscribe",
      "/(base)/subscribe/unsubscribe",
      "/(base)/unauthenticated",
      "/(base)/vision",
      "/(base)/workspace/applications/application/[applicationId]/form/[appFormId]",
      "/(base)/workspace/applications/application/[applicationId]/form/[appFormId]/success",
      "/(base)/workspace/applications/application/[applicationId]",
      "/(print)/print/application/[applicationId]/form/[appFormId]",
    ]);
  });
});
