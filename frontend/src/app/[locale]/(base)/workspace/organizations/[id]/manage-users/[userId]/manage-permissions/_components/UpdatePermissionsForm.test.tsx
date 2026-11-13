import { fireEvent, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import { UpdatePermissionsForm } from "./UpdatePermissionsForm";

type NavigationGuardOptions = { enabled: boolean; confirm: () => boolean };

const useNavigationGuardMock = jest.fn<void, [NavigationGuardOptions]>();

jest.mock("next-navigation-guard", () => ({
  useNavigationGuard: (options: NavigationGuardOptions) =>
    useNavigationGuardMock(options),
}));

const applications = [
  { applicationId: "app-1", applicationName: "Application Name 1" },
  { applicationId: "app-2", applicationName: "Application Name 2" },
];

const initialValues = {
  accessScope: "all" as const,
  selectedApplicationIds: [],
  isExternal: false,
};

const renderForm = () =>
  render(
    <UpdatePermissionsForm
      initialValues={initialValues}
      applications={applications}
    />,
  );

const lastGuardOptions = () =>
  useNavigationGuardMock.mock.calls[
    useNavigationGuardMock.mock.calls.length - 1
  ][0];

const lastGuardEnabled = () => lastGuardOptions().enabled;

describe("UpdatePermissionsForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the access options, application picker and External checkbox", () => {
    renderForm();

    expect(screen.getByLabelText(/^accessAll/)).toBeChecked();
    expect(screen.getByLabelText(/^accessSelected/)).not.toBeChecked();
    expect(screen.getByLabelText("Application Name 1")).toBeInTheDocument();
    expect(screen.getByLabelText("externalCheckbox")).not.toBeChecked();
    expect(screen.getByTestId("save-permission-updates")).toBeInTheDocument();
  });

  it("disables the application picker until access is limited", () => {
    renderForm();

    expect(screen.getByLabelText("Application Name 1")).toBeDisabled();

    fireEvent.click(screen.getByLabelText(/^accessSelected/));

    expect(screen.getByLabelText("Application Name 1")).toBeEnabled();
  });

  it("shows all applications as selected while access isn't limited", () => {
    renderForm();

    expect(screen.getByTestId("all-applications")).toHaveTextContent(
      "allApplications",
    );
  });

  it("lists the selected applications", () => {
    renderForm();

    fireEvent.click(screen.getByLabelText(/^accessSelected/));
    expect(screen.getByTestId("no-applications-selected")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Application Name 2"));

    expect(screen.getByTestId("selected-applications")).toHaveTextContent(
      "Application Name 2",
    );
    expect(screen.getByTestId("selected-applications")).not.toHaveTextContent(
      "Application Name 1",
    );

    fireEvent.click(screen.getByLabelText("Application Name 2"));

    expect(screen.getByTestId("no-applications-selected")).toBeInTheDocument();
  });

  it("ignores hidden application selections once access is set back to all", () => {
    renderForm();

    fireEvent.click(screen.getByLabelText(/^accessSelected/));
    fireEvent.click(screen.getByLabelText("Application Name 1"));
    expect(lastGuardEnabled()).toBe(true);

    fireEvent.click(screen.getByLabelText(/^accessAll/));
    expect(lastGuardEnabled()).toBe(false);

    fireEvent.click(screen.getByLabelText(/^accessSelected/));
    expect(screen.getByLabelText("Application Name 1")).toBeChecked();
  });

  it("toggles the External checkbox", () => {
    renderForm();

    fireEvent.click(screen.getByLabelText("externalCheckbox"));

    expect(screen.getByLabelText("externalCheckbox")).toBeChecked();
  });

  it("only warns about leaving the page when there are unsaved changes", () => {
    renderForm();

    expect(lastGuardEnabled()).toBe(false);

    fireEvent.click(screen.getByLabelText("externalCheckbox"));
    expect(lastGuardEnabled()).toBe(true);

    fireEvent.click(screen.getByLabelText("externalCheckbox"));
    expect(lastGuardEnabled()).toBe(false);
  });

  it("asks to confirm before saving", () => {
    renderForm();

    fireEvent.click(screen.getByLabelText(/^accessSelected/));
    fireEvent.click(screen.getByTestId("save-permission-updates"));

    // the confirmation modal's description, translated as its key in tests
    expect(screen.getByText("description")).toBeInTheDocument();
    expect(screen.getByTestId("confirm-permission-updates")).toHaveTextContent(
      "confirm",
    );
    // nothing is saved until the user confirms
    expect(lastGuardEnabled()).toBe(true);
  });

  it("clears the unsaved changes warning once the save is confirmed", () => {
    renderForm();

    fireEvent.click(screen.getByLabelText(/^accessSelected/));
    fireEvent.click(screen.getByTestId("save-permission-updates"));
    fireEvent.click(screen.getByTestId("confirm-permission-updates"));

    expect(lastGuardEnabled()).toBe(false);
    expect(screen.getByLabelText(/^accessSelected/)).toBeChecked();
  });

  it("keeps the changes unsaved when the save is cancelled", () => {
    renderForm();

    fireEvent.click(screen.getByLabelText(/^accessSelected/));
    fireEvent.click(screen.getByTestId("save-permission-updates"));
    fireEvent.click(screen.getByRole("button", { name: "cancel" }));

    expect(lastGuardEnabled()).toBe(true);
  });

  it("clears hidden application selections on save", () => {
    renderForm();

    fireEvent.click(screen.getByLabelText(/^accessSelected/));
    fireEvent.click(screen.getByLabelText("Application Name 1"));
    fireEvent.click(screen.getByLabelText(/^accessAll/));
    fireEvent.click(screen.getByTestId("save-permission-updates"));
    fireEvent.click(screen.getByTestId("confirm-permission-updates"));

    expect(screen.getByLabelText("Application Name 1")).not.toBeChecked();
  });

  it("asks the browser to confirm before leaving with unsaved changes", () => {
    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(false);
    renderForm();

    expect(lastGuardOptions().confirm()).toBe(false);
    expect(confirmSpy).toHaveBeenCalledWith("unsavedChangesWarning");
    confirmSpy.mockRestore();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderForm();

    expect(await axe(container)).toHaveNoViolations();
  });
});
