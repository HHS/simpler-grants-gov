import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { useFeatureFlags } from "src/hooks/useFeatureFlags";

import Search from "../../src/app/search/page";
import { MOCKOPPORTUNITIES } from "../../src/services/searchfetcher/MockSearchFetcher";

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

describe("Search", () => {
  it("passes accessibility scan", async () => {
    setFeatureFlag("showSearchV0", true);
    const { container } = render(
      <Search initialOpportunities={MOCKOPPORTUNITIES} />,
    );
    const results = await waitFor(() => axe(container));
    expect(results).toHaveNoViolations();
  });

  describe("Search feature flag", () => {
    it("renders search results when feature flag is on", () => {
      setFeatureFlag("showSearchV0", true);
      render(<Search initialOpportunities={MOCKOPPORTUNITIES} />);
      expect(screen.getByText(/sunt aut/i)).toBeInTheDocument();
    });

    it("renders PageNotFound when feature flag is off", () => {
      setFeatureFlag("showSearchV0", false);
      render(<Search initialOpportunities={MOCKOPPORTUNITIES} />);
      expect(
        screen.getByText(
          /The page you have requested cannot be displayed because it does not exist, has been moved/i,
        ),
      ).toBeInTheDocument();
    });
  });
});
