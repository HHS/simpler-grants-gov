import userEvent from "@testing-library/user-event";
import { fakeUserRole } from "src/utils/testing/fixtures";
import { render, screen } from "tests/react-utils";

import { UserInviteForm } from "src/components/manageUsers/UserInviteForm";

type InviteState = {
  validationErrors?: { email?: string[]; role?: string[] };
  errorMessage?: string;
  success?: boolean;
};

type UseActionStateTuple = [
  state: InviteState,
  dispatch: (formData: FormData) => void,
  isPending: boolean,
];

const mockUseActionState = jest.fn<UseActionStateTuple, []>();

const dispatchNoop: UseActionStateTuple[1] = () => undefined;

jest.mock("react", () => ({
  ...jest.requireActual<typeof import("react")>("react"),
  useActionState: () => mockUseActionState(),
}));

jest.mock(
  "src/app/[locale]/(base)/organizations/[id]/manage-users/actions",
  () => ({
    inviteUserAction: () => undefined,
  }),
);

describe("UserInviteForm", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("renders the form controls", () => {
    mockUseActionState.mockReturnValue([{}, dispatchNoop, false]);

    render(<UserInviteForm organizationId="1" roles={[fakeUserRole]} />);

    // These roles are stable and meaningful
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();

    // and your role option is present
    expect(
      screen.getByRole("option", { name: fakeUserRole.role_name }),
    ).toBeInTheDocument();
  });

  it("renders validation errors", () => {
    mockUseActionState.mockReturnValue([
      { validationErrors: { email: ["some error"] } },
      () => undefined,
      false,
    ]);

    render(<UserInviteForm organizationId="1" roles={[fakeUserRole]} />);

    expect(screen.getByRole("alert")).toHaveTextContent("some error");
  });

  it("displays error UI when an error occurs", () => {
    mockUseActionState.mockReturnValue([
      { errorMessage: "big error" },
      () => undefined,
      false,
    ]);

    render(<UserInviteForm organizationId="1" roles={[fakeUserRole]} />);

    // If your component uses a heading for error state, assert it,
    // but don't assert translation keys.
    expect(screen.getByRole("heading")).toBeInTheDocument();
  });

  it("calls the action on submit", async () => {
    const user = userEvent.setup();

    const mockAction = jest.fn<void, [FormData]>();
    mockUseActionState.mockReturnValue([{ success: false }, mockAction, false]);

    render(<UserInviteForm organizationId="1" roles={[fakeUserRole]} />);

    await user.type(screen.getByRole("textbox"), "an@email.address");
    await user.selectOptions(
      screen.getByRole("combobox"),
      fakeUserRole.role_name,
    );
    await user.click(screen.getByRole("button"));

    expect(mockAction).toHaveBeenCalledTimes(1);
    expect(mockAction.mock.calls[0]?.[0]).toBeInstanceOf(FormData);
  });
});
