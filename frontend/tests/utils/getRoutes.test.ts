import { getNextRoutes, listPaths } from "src/utils/getRoutes";

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
jest.mock("src/utils/getRoutes", () => {
  const originalModule = jest.requireActual("src/utils/getRoutes");
  return {
    ...originalModule,
    listPaths: jest.fn(),
  };
});

const mockedListPaths = listPaths as jest.MockedFunction<typeof listPaths>;

// TODO: https://github.com/navapbc/simpler-grants-gov/issues/98
describe("getNextRoutes", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("should get Next.js routes from src directory", () => {
    const mockedFiles: string[] = getPaths();

    mockedListPaths.mockReturnValue(mockedFiles);

    const result = getNextRoutes("src/app");

    expect(result).toEqual([
      "/dev/feature-flags",
      "/error",
      "/health",
      "/login",
      "/maintenance",
      "/opportunity/1",
      "/",
      "/process",
      "/research",
      "/saved-grants",
      "/search",
      "/subscribe/confirmation",
      "/subscribe",
      "/subscribe/unsubscribe",
      "/unauthenticated",
      "/unauthorized",
    ]);
  });
});

function getPaths() {
  return [
    "src/app/[locale]/dev/feature-flags/FeatureFlagsTable.tsx",
    "src/app/[locale]/dev/feature-flags/page.tsx",
    "src/app/[locale]/health/page.tsx",
    "src/app/[locale]/page.tsx",
    "src/app/[locale]/process/ProcessIntro.tsx",
    "src/app/[locale]/process/ProcessInvolved.tsx",
    "src/app/[locale]/process/ProcessMilestones.tsx",
    "src/app/[locale]/process/page.tsx",
    "src/app/[locale]/research/ResearchArchetypes.tsx",
    "src/app/[locale]/research/ResearchImpact.tsx",
    "src/app/[locale]/research/ResearchIntro.tsx",
    "src/app/[locale]/research/ResearchMethodology.tsx",
    "src/app/[locale]/research/ResearchThemes.tsx",
    "src/app/[locale]/research/page.tsx",
    "src/app/[locale]/search/SearchForm.tsx",
    "src/app/[locale]/search/actions.ts",
    "src/app/[locale]/search/error.tsx",
    "src/app/[locale]/search/page.tsx",
    "src/app/[locale]/subscribe/SubscriptionForm.tsx",
    "src/app/[locale]/subscribe/confirmation/page.tsx",
    "src/app/[locale]/subscribe/page.tsx",
    "src/app/[locale]/subscribe/unsubscribe/page.tsx",
    "src/app/api/BaseApi.ts",
    "src/app/api/SearchOpportunityAPI.ts",
    "src/app/api/mock/APIMockResponse.json",
    "src/app/layout.tsx",
    "src/app/not-found.tsx",
    "src/app/sitemap.ts",
    "src/app/template.tsx",
  ];
}
