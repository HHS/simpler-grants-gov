/* eslint-disable jest/no-commented-out-tests */

import { useFeatureFlags } from "src/hooks/useFeatureFlags";

jest.mock("src/hooks/useFeatureFlags");

const setFeatureFlag = (flag: string, value: boolean) => {
  (useFeatureFlags as jest.Mock).mockReturnValue({
    featureFlagsManager: {
      isFeatureEnabled: jest.fn((featureName: string) =>
        featureName === flag ? value : false,
      ),
    },
    mounted: true,
  });
};

const mockData = [
  {
    agency: "firstagency",
    category: "firstcategory",
    opportunity_title: "firsttitle",
  },
  {
    agency: "secondagency2",
    category: "secondcategory",
    opportunity_title: "secondtitle",
  },
];

// Mock both search fetchers in case we switch
// Could also switch on a feature flag
jest.mock("../../src/services/search/searchfetcher/APISearchFetcher", () => {
  return {
    APISearchFetcher: jest.fn().mockImplementation(() => {
      return {
        fetchOpportunities: jest.fn().mockImplementation(() => {
          return Promise.resolve(mockData);
        }),
      };
    }),
  };
});

jest.mock("../../src/services/search/searchfetcher/MockSearchFetcher", () => {
  return {
    MockSearchFetcher: jest.fn().mockImplementation(() => {
      return {
        fetchOpportunities: jest.fn().mockImplementation(() => {
          return Promise.resolve(mockData);
        }),
      };
    }),
  };
});

describe("Search", () => {
  it("should pass", () => {
    setFeatureFlag("showSearchV0", true);
    expect(1).toBe(1);
  });
  // TODO (Issue #1393): Redo tests after converting search to server component. Save below for reference

  //   it("passes accessibility scan", async () => {
  //     setFeatureFlag("showSearchV0", true);
  //     const { container } = render(<Search />);
  //     const results = await waitFor(() => axe(container));
  //     expect(results).toHaveNoViolations();
  //   });

  //   describe("Search feature flag", () => {
  //     it("renders search results when feature flag is on", async () => {
  //       setFeatureFlag("showSearchV0", true);
  //       render(<Search />);
  //       fireEvent.click(screen.getByRole("button", { name: /update results/i }));

  //       await waitFor(() => {
  //         expect(screen.getByText(/firstcategory/i)).toBeInTheDocument();
  //       });
  //       expect(screen.getByText(/secondcategory/i)).toBeInTheDocument();
  //     });

  //     it("renders PageNotFound when feature flag is off", async () => {
  //       setFeatureFlag("showSearchV0", false);
  //       render(<Search />);

  //       await waitFor(() => {
  //         expect(
  //           screen.getByText(
  //             /The page you have requested cannot be displayed because it does not exist, has been moved/i,
  //           ),
  //         ).toBeInTheDocument();
  //       });
  //     });
  //   });
});
