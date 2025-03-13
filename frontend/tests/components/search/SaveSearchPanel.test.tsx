import { render, screen, waitFor } from "@testing-library/react";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import { ReadonlyURLSearchParams } from "next/navigation";

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

jest.mock("src/hooks/useSearchParamUpdater", () => ({
  useSearchParamUpdater: () => ({
    searchParams: new ReadonlyURLSearchParams(),
    replaceQueryParams: jest.fn(),
  }),
}));

describe("SaveSearchPanel", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("renders a copy button when not authenticated", () => {
    mockUseUser.mockImplementation(() => ({
      user: {
        token: undefined,
      },
    }));
    render(<SaveSearchPanel />);
    const copyButton = screen.getByText("copySearch.copy.unauthenticated");
    expect(copyButton).toBeInTheDocument();
  });
  it("renders a copy button when authenticated", () => {
    mockUseUser.mockImplementation(() => ({
      user: {
        token: "a token",
      },
    }));
    render(<SaveSearchPanel />);
    const copyButton = screen.getByText("copySearch.copy.authenticated");
    expect(copyButton).toBeInTheDocument();
  });
  it("renders a save button when authenticated", () => {
    mockUseUser.mockImplementation(() => ({
      user: {
        token: "a token",
      },
    }));
    render(<SaveSearchPanel />);
    const saveButton = screen.getByTestId("open-save-search-modal-button");
    expect(saveButton).toBeInTheDocument();
  });

  // not able to reliably test this due to dynamic imports
  // was able to get things to work locally using jest-next-dynamic, but this did not work in CI
  it.skip("displays a tooltip next to copy button when not authenticated", async () => {
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
  it.skip("displays a tooltip next to description text when authenticated", () => {
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
