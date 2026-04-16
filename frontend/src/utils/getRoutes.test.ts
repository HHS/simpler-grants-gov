import { getNextRoutes } from "src/utils/getRoutes";

// TODO: https://github.com/navapbc/simpler-grants-gov/issues/98
// Need to move listPaths to a different file and mock it in order to make this more isolated

describe("getNextRoutes", () => {
  it("should get Next.js routes from src directory", () => {
    const result = getNextRoutes("src/app");

    expect(result).toEqual([
      "/(base)/[...not-found]",
      "/(base)/award-recommendation/1/edit",
      "/(base)/award-recommendation/1",
      "/(base)/dev/feature-flags",
      "/(base)/developers/api-dashboard",
      "/(base)/developers",
      "/(base)/error",
      "/(base)/events",
      "/(base)/login",
      "/(base)/maintenance",
      "/(base)/newsletter/confirmation",
      "/(base)/newsletter",
      "/(base)/newsletter/unsubscribe",
      "/(base)/notifications",
      "/(base)/opportunities/create",
      "/(base)/opportunities",
      "/(base)/opportunity/1",
      "/(base)",
      "/(base)/research-participant-guide",
      "/(base)/roadmap",
      "/(base)/search",
      "/(base)/settings",
      "/(base)/unauthenticated",
      "/(base)/vision",
      "/(base)/workspace/applications/[applicationId]/form/[appFormId]",
      "/(base)/workspace/applications/[applicationId]/form/[appFormId]/success",
      "/(base)/workspace/applications/[applicationId]",
      "/(base)/workspace/applications",
      "/(base)/workspace/organizations/1/manage-users/legacy",
      "/(base)/workspace/organizations/1/manage-users",
      "/(base)/workspace/organizations/1",
      "/(base)/workspace/organizations",
      "/(base)/workspace",
      "/(base)/workspace/saved-opportunities",
      "/(base)/workspace/saved-search-queries",
      "/(print)/print/application/[applicationId]/form/[appFormId]",
    ]);
  });
});
