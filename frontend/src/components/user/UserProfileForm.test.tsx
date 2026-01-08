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

describe("UserProfileForm", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("renders the main sections and the login.gov link", () => {
    mockUseActionState.mockReturnValue([{ validationErrors: {} }, noop, false]);

    render(<UserProfileForm userDetails={fakeUserWithProfile} />);

    // Heading is the translated English string
    expect(
      screen.getByRole("heading", { name: "Contact information" }),
    ).toBeInTheDocument();

    // The rich translation renders a link to login.gov
    const link = screen.getByRole("link", { name: "login.gov" });
    expect(link).toHaveAttribute("href", "https://login.gov");
    expect(link).toHaveAttribute("target", "_blank");

    // Form inputs exist (first/middle/last/email)
    expect(screen.getAllByRole("textbox")).toHaveLength(4);

    // Save button text is translated
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
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
      throw new Error("Fixture must include profile");
    }

    mockUseActionState.mockReturnValue([{ validationErrors: {} }, noop, false]);

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
        validationErrors: {},
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
      { validationErrors: {}, errorMessage: "big error" },
      noop,
      false,
    ]);

    render(<UserProfileForm userDetails={fakeUserWithProfile} />);

    // Alert heading is translated English
    expect(screen.getByRole("heading", { name: "Error" })).toBeInTheDocument();
    expect(screen.getByText("big error")).toBeInTheDocument();
  });
});
