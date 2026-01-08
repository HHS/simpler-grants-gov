import React from "react";
import { render, screen, waitFor } from "tests/react-utils";
import userEvent from "@testing-library/user-event";

import { OpportunitySaveUserControl } from "src/components/user/OpportunitySaveUserControl";

// ---- controllable mocks ----
let mockUser: Record<string, unknown> = {};
let isSSRValue = false;
let featureFlagOn = true;

const clientFetchMock = jest.fn();

const setHelpText = jest.fn();
const setButtonText = jest.fn();
const setCloseText = jest.fn();
const setDescriptionText = jest.fn();
const setTitleText = jest.fn();

jest.mock("src/hooks/useIsSSR", () => ({
  useIsSSR: () => isSSRValue,
}));

jest.mock("src/hooks/useFeatureFlags", () => ({
  useFeatureFlags: () => ({
    checkFeatureFlag: () => featureFlagOn,
  }),
}));

jest.mock("src/services/auth/useUser", () => ({
  useUser: () => ({ user: mockUser }),
}));

jest.mock("src/hooks/useClientFetch", () => ({
  useClientFetch: () => ({
    clientFetch: (...args: unknown[]) => clientFetchMock(...args) as unknown,
  }),
}));

jest.mock("src/services/auth/LoginModalProvider", () => ({
  useLoginModal: () => ({
    loginModalRef: React.createRef(),
    setHelpText,
    setButtonText,
    setCloseText,
    setDescriptionText,
    setTitleText,
  }),
}));

jest.mock("src/components/USWDSIcon", () => ({
  USWDSIcon: (_props: unknown) => <span data-testid="icon" />,
}));

/**
 * Replace ModalToggleButton with a plain <button> so id/onClick are testable.
 */
jest.mock("@trussworks/react-uswds", () => {
  const actual = jest.requireActual("@trussworks/react-uswds");
  return {
    ...actual,
    ModalToggleButton: ({
      children,
      onClick,
      id,
      disabled,
      className,
      "data-testid": dataTestId,
    }: any) => (
      <button
        type="button"
        id={id}
        disabled={disabled}
        className={className}
        data-testid={dataTestId}
        onClick={onClick}
      >
        {children}
      </button>
    ),
  };
});

/**
 * SaveIcon:
 * - logged in branch passes onClick => render a clickable button
 * - logged out branch does not => render a span (avoids nested buttons)
 */
jest.mock("src/components/SaveIcon", () => ({
  __esModule: true,
  default: ({
    saved,
    onClick,
    loading,
  }: {
    saved: boolean;
    onClick?: () => void;
    loading?: boolean;
  }) =>
    onClick ? (
      <button
        type="button"
        aria-label={saved ? "Remove from saved" : "Save opportunity"}
        disabled={!!loading}
        onClick={onClick}
      >
        SaveIcon
      </button>
    ) : (
      <span data-testid="save-icon" data-saved={String(saved)}>
        SaveIcon
      </span>
    ),
}));

jest.mock("src/components/SaveButton", () => ({
  __esModule: true,
  default: (props: any) => (
    <button type="button" onClick={props.buttonClick}>
      SaveButton
    </button>
  ),
}));

describe("OpportunitySaveUserControl", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockUser = {};
    isSSRValue = false;
    featureFlagOn = true;
    clientFetchMock.mockReset();
  });

  it("returns null when feature flag is off", () => {
    featureFlagOn = false;

    const { container } = render(
      <OpportunitySaveUserControl
        opportunityId="opp-1"
        opportunitySaved={false}
        type="button"
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("icon: logged out + SSR renders non-interactive SaveIcon only", () => {
    isSSRValue = true;
    mockUser = { token: "" };

    render(
      <OpportunitySaveUserControl
        opportunityId="opp-1"
        opportunitySaved={false}
        type="icon"
      />,
    );

    expect(screen.getByTestId("save-icon")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /save opportunity/i }),
    ).not.toBeInTheDocument();
  });

  it("icon: logged out + client renders a ModalToggleButton with id and sets login modal copy on click", async () => {
    const user = userEvent.setup();
    isSSRValue = false;
    mockUser = { token: "" };

    render(
      <OpportunitySaveUserControl
        opportunityId="opp-1"
        opportunitySaved={false}
        type="icon"
      />,
    );

    const toggle = document.getElementById("save-search-result-opp-1");
    expect(toggle).toBeTruthy();

    await user.click(toggle as HTMLElement);

    expect(setHelpText).toHaveBeenCalled();
    expect(setButtonText).toHaveBeenCalled();
    expect(setCloseText).toHaveBeenCalled();
    expect(setDescriptionText).toHaveBeenCalled();
    expect(setTitleText).toHaveBeenCalled();
  });

  it("button: logged out + client renders a login toggle and sets copy on click", async () => {
    const user = userEvent.setup();
    isSSRValue = false;
    mockUser = { token: "" };

    render(
      <OpportunitySaveUserControl
        opportunityId="opp-1"
        opportunitySaved={false}
        type="button"
      />,
    );

    // This is the outer toggle button (our ModalToggleButton mock)
    const toggle = screen.getByRole("button");
    await user.click(toggle);

    expect(setTitleText).toHaveBeenCalled();
  });

  it("icon: logged in performs POST when not saved and flips to saved when API returns type=save", async () => {
    const user = userEvent.setup();
    mockUser = { token: "token" };
    clientFetchMock.mockResolvedValue({ type: "save" });

    render(
      <OpportunitySaveUserControl
        opportunityId="opp-1"
        opportunitySaved={false}
        type="icon"
      />,
    );

    const saveBtn = screen.getByRole("button", { name: /save opportunity/i });
    await user.click(saveBtn);

    expect(clientFetchMock).toHaveBeenCalledWith(
      "/api/user/saved-opportunities",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ opportunityId: "opp-1" }),
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /remove from saved/i }),
      ).toBeInTheDocument();
    });
  });
});
