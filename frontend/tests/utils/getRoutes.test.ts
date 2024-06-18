import { getNextRoutes, listPaths } from "../../src/utils/getRoutes";

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
jest.mock("../../src/utils/getRoutes", () => {
  const originalModule = jest.requireActual("../../src/utils/getRoutes");
  return {
    ...originalModule,
    listPaths: jest.fn(),
  };
});

const mockedListPaths = listPaths as jest.MockedFunction<typeof listPaths>;

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
      "/health",
      "/newsletter/confirmation",
      "/newsletter",
      "/newsletter/unsubscribe",
      "/",
      "/process",
      "/research",
      "/search",
    ]);
  });
});

function getPaths() {
  return [
    "src/app/[locale]/dev/feature-flags/FeatureFlagsTable.tsx",
    "src/app/[locale]/dev/feature-flags/page.tsx",
    "src/app/[locale]/health/page.tsx",
    "src/app/[locale]/newsletter/NewsletterForm.tsx",
    "src/app/[locale]/newsletter/confirmation/page.tsx",
    "src/app/[locale]/newsletter/page.tsx",
    "src/app/[locale]/newsletter/unsubscribe/page.tsx",
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
    "src/app/[locale]/search/loading.tsx",
    "src/app/[locale]/search/page.tsx",
    "src/app/api/BaseApi.ts",
    "src/app/api/SearchOpportunityAPI.ts",
    "src/app/api/mock/APIMockResponse.json",
    "src/app/layout.tsx",
    "src/app/not-found.tsx",
    "src/app/sitemap.ts",
    "src/app/template.tsx",
  ];
}
