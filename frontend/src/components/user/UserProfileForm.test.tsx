import { render, screen } from "@testing-library/react";
import { noop } from "lodash";
import { fakeUserWithProfile } from "src/utils/testing/fixtures";

import { UserProfileForm } from "src/components/user/UserProfileForm";

const mockUseActionState = jest.fn();

jest.mock("react", () => ({
  ...jest.requireActual<typeof import("react")>("react"),
  useActionState: () => mockUseActionState() as unknown,
}));

jest.mock("src/app/[locale]/(base)/settings/actions", () => ({
  userProfileAction: noop,
}));

describe("userProfileForm", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("renders validation errors", () => {
    mockUseActionState.mockReturnValue([
      { validationErrors: { firstName: ["some error"] } },
      noop,
      false,
    ]);

    render(<UserProfileForm userDetails={fakeUserWithProfile} />);

    const alert = screen.getByRole("alert");

    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent("some error");
  });
  it("displays values from userDetail props if form is not submitted", () => {
    if (!fakeUserWithProfile.profile) {
      throw new Error("this will not happen, just here to get TS to behave");
    }
    mockUseActionState.mockReturnValue([{}, noop, false]);

    render(<UserProfileForm userDetails={fakeUserWithProfile} />);

    expect(
      screen.getByDisplayValue(fakeUserWithProfile.profile.first_name),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(fakeUserWithProfile.profile.last_name),
    ).toBeInTheDocument();
  });
  it("displays values from form action when available", () => {
    mockUseActionState.mockReturnValue([
      {
        data: {
          first_name: "something",
          middle_name: "else",
          last_name: "entirely",
        },
      },
      noop,
      false,
    ]);

    render(<UserProfileForm userDetails={fakeUserWithProfile} />);

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

    render(<UserProfileForm userDetails={fakeUserWithProfile} />);

    const alert = screen.getByRole("heading", { name: "errorHeading" });
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent("errorHeading");
  });
});
