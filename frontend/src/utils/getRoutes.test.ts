import { getNextRoutes } from "src/utils/getRoutes";

// TODO: https://github.com/navapbc/simpler-grants-gov/issues/98
// Need to move listPaths to a different file and mock it in order to make this more isolated

describe("getNextRoutes", () => {
  it("should get Next.js routes from src directory", () => {
    const result = getNextRoutes("src/app");

    expect(result).toEqual([
      "/(base)/[...not-found]",
      "/(base)/api-dashboard",
      "/(base)/applications/[applicationId]/form/[appFormId]",
      "/(base)/applications/[applicationId]/form/[appFormId]/success",
      "/(base)/applications/[applicationId]",
      "/(base)/applications",
      "/(base)/award-recommendation",
      "/(base)/dashboard",
      "/(base)/dev/feature-flags",
      "/(base)/developer",
      "/(base)/error",
      "/(base)/events",
      "/(base)/login",
      "/(base)/maintenance",
      "/(base)/newsletter/confirmation",
      "/(base)/newsletter",
      "/(base)/newsletter/unsubscribe",
      "/(base)/opportunities",
      "/(base)/opportunity/1",
      "/(base)/organizations/1/manage-users/legacy",
      "/(base)/organizations/1/manage-users",
      "/(base)/organizations/1",
      "/(base)/organizations",
      "/(base)",
      "/(base)/research-participant-guide",
      "/(base)/roadmap",
      "/(base)/saved-opportunities",
      "/(base)/saved-search-queries",
      "/(base)/search",
      "/(base)/settings",
      "/(base)/unauthenticated",
      "/(base)/vision",
      "/(print)/print/application/[applicationId]/form/[appFormId]",
    ]);
  });
});
