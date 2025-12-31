import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import { UserDropdown } from "src/components/user/UserControl";

const mockPush = jest.fn();
const mockUseUser = jest.fn(() => ({
  user: {
    token: "faketoken",
  },
  hasBeenLoggedOut: false,
  resetHasBeenLoggedOut: jest.fn(),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

jest.mock("src/hooks/useFeatureFlags", () => ({
  useFeatureFlags: () => ({
    checkFeatureFlag: () => true,
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: (url: unknown): unknown => mockPush(url),
  }),
}));

jest.mock("src/services/auth/useUser", () => ({
  useUser: () => mockUseUser(),
}));

describe("UserDropdown", () => {
  it("does not display test application link if not for a test application user", async () => {
    render(<UserDropdown isApplicationTestUser={false} />);

    const menuOpenButton = screen.getByTestId("navDropDownButton");
    await userEvent.click(menuOpenButton);

    expect(
      screen.queryByRole("link", { name: "testApplication" }),
    ).not.toBeInTheDocument();
  });

  it("displays test application link if for a test application user", async () => {
    render(<UserDropdown isApplicationTestUser={true} />);

    const menuOpenButton = screen.getByTestId("navDropDownButton");
    await userEvent.click(menuOpenButton);

    expect(
      screen.getByRole("link", { name: "testApplication" }),
    ).toBeInTheDocument();
  });
});
