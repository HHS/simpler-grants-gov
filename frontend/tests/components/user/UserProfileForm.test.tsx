import { render, screen } from "@testing-library/react";
import { noop } from "lodash";
import { fakeUser } from "src/utils/testing/fixtures";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import { UserProfileForm } from "src/components/user/UserProfileForm";

const mockUseActionState = jest.fn();

jest.mock("react", () => ({
  ...jest.requireActual<typeof import("react")>("react"),
  useActionState: () => mockUseActionState() as unknown,
}));

jest.mock("src/app/[locale]/(base)/user/account/actions", () => ({
  userProfileAction: noop,
}));

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

describe("userProfileForm", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  it("matches snapshot", () => {
    mockUseActionState.mockReturnValue([{}, noop, false]);
    const { container } = render(<UserProfileForm userDetails={fakeUser} />);
    expect(container).toMatchSnapshot();
  });
  it("renders validation errors", () => {
    mockUseActionState.mockReturnValue([
      { validationErrors: { firstName: ["some error"] } },
      noop,
      false,
    ]);

    render(<UserProfileForm userDetails={fakeUser} />);

    const alert = screen.getByRole("alert");

    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent("some error");
  });
  it("displays values from userDetail props if form is not submitted", () => {
    if (!fakeUser.profile) {
      throw new Error("this will not happen, just here to get TS to behave");
    }
    mockUseActionState.mockReturnValue([{}, noop, false]);

    render(<UserProfileForm userDetails={fakeUser} />);

    expect(
      screen.getByDisplayValue(fakeUser.profile.first_name),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(fakeUser.profile.last_name),
    ).toBeInTheDocument();
  });
  it("displays values from form action when available", () => {
    mockUseActionState.mockReturnValue([
      {
        data: {
          profile: {
            first_name: "something",
            middle_name: "else",
            last_name: "entirely",
          },
        },
      },
      noop,
      false,
    ]);

    render(<UserProfileForm userDetails={fakeUser} />);

    expect(screen.getByDisplayValue("something")).toBeInTheDocument();
    expect(screen.getByDisplayValue("else")).toBeInTheDocument();
    expect(screen.getByDisplayValue("entirely")).toBeInTheDocument();
  });
  it("displays error message on error", () => {
    mockUseActionState.mockReturnValue([
      {
        errorMessage: "big error",
      },
      noop,
      false,
    ]);

    render(<UserProfileForm userDetails={fakeUser} />);

    const alert = screen.getByRole("heading");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent("errorHeading");
  });
});
