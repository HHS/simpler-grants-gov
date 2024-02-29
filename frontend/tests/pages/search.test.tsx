import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { useFeatureFlags } from "src/hooks/useFeatureFlags";

import Search from "../../src/app/search/page";

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
    const { container } = render(<Search />);
    const results = await waitFor(() => axe(container));
    expect(results).toHaveNoViolations();
  });

  describe("Search feature flag", () => {
    it("renders search results when feature flag is on", async () => {
      setFeatureFlag("showSearchV0", true);
      render(<Search />);
      fireEvent.click(screen.getByRole("button", { name: /update results/i }));

      await waitFor(() => {
        expect(screen.getByText(/sunt aut/i)).toBeInTheDocument();
      });
    });

    it("renders PageNotFound when feature flag is off", async () => {
      setFeatureFlag("showSearchV0", false);
      render(<Search />);

      await waitFor(() => {
        expect(
          screen.getByText(
            /The page you have requested cannot be displayed because it does not exist, has been moved/i,
          ),
        ).toBeInTheDocument();
      });
    });
  });
});
