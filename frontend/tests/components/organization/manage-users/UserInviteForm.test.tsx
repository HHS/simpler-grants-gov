import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { noop } from "lodash";
import { fakeUserRole } from "src/utils/testing/fixtures";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import { UserInviteForm } from "src/components/manageUsers/UserInviteForm";

const mockUseActionState = jest.fn();

jest.mock("react", () => ({
  ...jest.requireActual<typeof import("react")>("react"),
  useActionState: () => mockUseActionState() as unknown,
}));

jest.mock(
  "src/app/[locale]/(base)/organizations/[id]/manage-users/actions",
  () => ({
    inviteUserAction: noop,
  }),
);

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

describe("UserInviteForm", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  it("renders validation errors", () => {
    mockUseActionState.mockReturnValue([
      { validationErrors: { email: ["some error"] } },
      noop,
      false,
    ]);

    render(<UserInviteForm organizationId="1" roles={[fakeUserRole]} />);

    const alert = screen.getByRole("alert");

    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent("some error");
  });
  it("displays error message on error", () => {
    mockUseActionState.mockReturnValue([
      {
        errorMessage: "big error",
      },
      noop,
      false,
    ]);

    render(<UserInviteForm organizationId="1" roles={[fakeUserRole]} />);

    const alert = screen.getByRole("heading");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent("errorHeading");
  });
  it("calls action with expected values on submit", async () => {
    const mockAction = jest.fn();
    const expectedFormData = new FormData();
    expectedFormData.append("role", fakeUserRole.role_id);
    expectedFormData.append("email", "an@email.address");

    mockUseActionState.mockReturnValue([
      {
        success: false,
      },
      mockAction,
      false,
    ]);

    render(<UserInviteForm organizationId="1" roles={[fakeUserRole]} />);

    const textInput = screen.getByRole("textbox");
    const select = screen.getByRole("combobox");
    const submitButton = screen.getByRole("button");

    await userEvent.type(textInput, "an@email.address");
    await userEvent.selectOptions(select, fakeUserRole.role_name);
    await userEvent.click(submitButton);

    expect(mockAction).toHaveBeenCalled();
  });
});
