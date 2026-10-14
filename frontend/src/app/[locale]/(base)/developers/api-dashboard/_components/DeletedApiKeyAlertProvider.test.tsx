import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import {
  DeletedApiKeyAlert,
  DeletedApiKeyAlertProvider,
  useDeletedApiKeyAlert,
} from "src/app/[locale]/(base)/developers/api-dashboard/_components/DeletedApiKeyAlertProvider";

const DeleteKeyButton = ({ keyName }: { keyName: string }) => {
  const { showDeletedAlert } = useDeletedApiKeyAlert();
  return (
    <button type="button" onClick={() => showDeletedAlert(keyName)}>
      delete {keyName}
    </button>
  );
};

const HideAlertButton = () => {
  const { hideDeletedAlert } = useDeletedApiKeyAlert();
  return (
    <button type="button" onClick={hideDeletedAlert}>
      hide
    </button>
  );
};

const renderWithMain = () =>
  render(
    <main id="main-content" tabIndex={-1}>
      <DeletedApiKeyAlertProvider>
        <DeletedApiKeyAlert />
        <HideAlertButton />
        <DeleteKeyButton keyName="Staging" />
        <DeleteKeyButton keyName="Production" />
      </DeletedApiKeyAlertProvider>
    </main>,
  );

describe("DeletedApiKeyAlertProvider", () => {
  it("renders its children and an empty status region by default", () => {
    renderWithMain();

    expect(
      screen.getByRole("button", { name: "delete Staging" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("shows a success alert in the status region after a key is deleted", async () => {
    const user = userEvent.setup();
    renderWithMain();

    await user.click(screen.getByRole("button", { name: "delete Staging" }));

    const alert = screen.getByTestId("deleted-api-key-alert");
    expect(screen.getByRole("status")).toContainElement(alert);
    expect(alert).toHaveClass("usa-alert--success", "usa-alert--slim");
    expect(alert).toHaveTextContent("deleteSuccessMessage");
  });

  it("replaces the alert rather than stacking when another key is deleted", async () => {
    const user = userEvent.setup();
    renderWithMain();

    await user.click(screen.getByRole("button", { name: "delete Staging" }));
    await user.click(screen.getByRole("button", { name: "delete Production" }));

    expect(screen.getAllByTestId("deleted-api-key-alert")).toHaveLength(1);
  });

  it("removes the alert when it is hidden", async () => {
    const user = userEvent.setup();
    renderWithMain();

    await user.click(screen.getByRole("button", { name: "delete Staging" }));
    await user.click(screen.getByRole("button", { name: "hide" }));

    expect(
      screen.queryByTestId("deleted-api-key-alert"),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("moves focus to the main content after a key is deleted", async () => {
    const user = userEvent.setup();
    renderWithMain();

    await user.click(screen.getByRole("button", { name: "delete Staging" }));

    await waitFor(() => {
      expect(screen.getByRole("main")).toHaveFocus();
    });
  });

  it("passes accessibility scan with the alert shown", async () => {
    const user = userEvent.setup();
    const { container } = renderWithMain();

    await user.click(screen.getByRole("button", { name: "delete Staging" }));

    expect(await axe(container)).toHaveNoViolations();
  });
});
