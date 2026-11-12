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

  it("lists the selected applications", () => {
    renderForm();

    expect(screen.getByTestId("no-applications-selected")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/^accessSelected/));
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

  it("clears the unsaved changes warning on save without leaving the page", () => {
    renderForm();

    fireEvent.click(screen.getByLabelText(/^accessSelected/));
    expect(lastGuardEnabled()).toBe(true);

    fireEvent.click(screen.getByTestId("save-permission-updates"));

    expect(lastGuardEnabled()).toBe(false);
    expect(screen.getByLabelText(/^accessSelected/)).toBeChecked();
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
