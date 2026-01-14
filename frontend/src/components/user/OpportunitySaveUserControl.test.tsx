import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { noop } from "lodash";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import { createRef } from "react";

import { OpportunitySaveUserControl } from "src/components/user/OpportunitySaveUserControl";

let mockUser = {};

const clientFetchMock = jest.fn();
const getUser = () => mockUser;

jest.mock("src/services/auth/useUser", () => ({
  useUser: () => ({
    user: getUser(),
  }),
}));

jest.mock("src/hooks/useClientFetch", () => ({
  useClientFetch: () => ({
    clientFetch: (...args: unknown[]) => clientFetchMock(...args) as unknown,
  }),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

jest.mock("src/hooks/useFeatureFlags", () => ({
  useFeatureFlags: () => ({
    checkFeatureFlag: () => true,
  }),
}));

jest.mock("src/services/auth/LoginModalProvider", () => ({
  useLoginModal: () => ({
    loginModalRef: createRef(),
    setButtonText: noop,
    setCloseText: noop,
    setDescriptionText: noop,
    setHelpText: noop,
    setTitleText: noop,
  }),
}));

describe("OpportunitySaveUserControl", () => {
  afterEach(() => {
    jest.resetAllMocks();
    mockUser = {};
  });
  it("is a function", () => {
    expect(typeof OpportunitySaveUserControl).toBe("function");
  });

  it("is defined", () => {
    // This is a basic test to ensure the component interface is correct
    const component = OpportunitySaveUserControl;
    expect(component).toBeDefined();
  });

  it("updates local saved state on save", async () => {
    clientFetchMock.mockResolvedValue({ type: "save" });
    mockUser = { token: "a token" };
    const { rerender } = render(
      <OpportunitySaveUserControl
        opportunitySaved={false}
        type="icon"
        opportunityId="saved-id"
      />,
    );

    let buttons = screen.getAllByRole("button");
    let saveButtons = buttons.filter((button) => {
      return button.getAttribute("aria-label") === "Save opportunity";
    });
    let unsaveButtons = buttons.filter(
      (button) => button.getAttribute("aria-label") === "Remove from saved",
    );
    expect(saveButtons).toHaveLength(1);
    expect(unsaveButtons).toHaveLength(0);

    await userEvent.click(saveButtons[0]);

    expect(clientFetchMock).toHaveBeenCalledTimes(1);

    rerender(
      <OpportunitySaveUserControl
        opportunitySaved={true}
        type="icon"
        opportunityId="saved-id"
      />,
    );
    buttons = screen.getAllByRole("button");
    saveButtons = buttons.filter((button) => {
      return button.getAttribute("aria-label") === "Save opportunity";
    });
    unsaveButtons = buttons.filter(
      (button) => button.getAttribute("aria-label") === "Remove from saved",
    );
    expect(saveButtons).toHaveLength(0);
    expect(unsaveButtons).toHaveLength(1);
  });
});
