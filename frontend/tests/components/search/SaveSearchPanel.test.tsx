import { render, screen, waitFor } from "@testing-library/react";
import preloadAll from "jest-next-dynamic";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import { SaveSearchPanel } from "src/components/search/SaveSearchPanel";

const mockUseUser = jest.fn();

jest.mock("src/hooks/useFeatureFlags", () => ({
  useFeatureFlags: () => ({
    checkFeatureFlag: () => true,
  }),
}));

jest.mock("src/services/auth/useUser", () => ({
  useUser: (): unknown => mockUseUser(),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

describe("SaveSearchPanel", () => {
  beforeAll(async () => {
    await preloadAll();
  });
  afterEach(() => {
    jest.resetAllMocks();
  });
  it("displays a tooltip next to copy button when not authenticated", async () => {
    mockUseUser.mockImplementation(() => ({
      user: {
        token: undefined,
      },
    }));
    render(<SaveSearchPanel />);
    const tooltipWrapper = screen.getByTestId("tooltipWrapper");
    await waitFor(() => expect(tooltipWrapper).toBeInTheDocument());
    // eslint-disable-next-line
    expect(tooltipWrapper.previousElementSibling).toHaveTextContent(
      "copySearch.copy.unauthenticated",
    );
  });
  it("displays a tooltip next to description text when authenticated", () => {
    mockUseUser.mockImplementation(() => ({
      user: {
        token: "a token",
      },
    }));
    render(<SaveSearchPanel />);
    const tooltipWrapper = screen.getByTestId("tooltipWrapper");
    expect(tooltipWrapper).toBeInTheDocument();
    // eslint-disable-next-line
    expect(tooltipWrapper.previousElementSibling).toHaveTextContent("heading");
  });
});
