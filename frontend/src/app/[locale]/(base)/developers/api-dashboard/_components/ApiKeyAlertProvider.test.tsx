import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import {
  ApiKeyAlert,
  ApiKeyAlertProvider,
  useApiKeyAlert,
} from "src/app/[locale]/(base)/developers/api-dashboard/_components/ApiKeyAlertProvider";

const ShowAlertButton = ({ message }: { message: string }) => {
  const { showAlert } = useApiKeyAlert();
  return (
    <button type="button" onClick={() => showAlert(message)}>
      show {message}
    </button>
  );
};

const HideAlertButton = () => {
  const { hideAlert } = useApiKeyAlert();
  return (
    <button type="button" onClick={hideAlert}>
      hide
    </button>
  );
};

const renderWithMain = () =>
  render(
    <main id="main-content" tabIndex={-1}>
      <ApiKeyAlertProvider>
        <ApiKeyAlert />
        <HideAlertButton />
        <ShowAlertButton message="Staging deleted" />
        <ShowAlertButton message="Production deleted" />
      </ApiKeyAlertProvider>
    </main>,
  );

describe("ApiKeyAlertProvider", () => {
  it("renders its children and an empty status region by default", () => {
    renderWithMain();

    expect(
      screen.getByRole("button", { name: "show Staging deleted" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("shows a success alert with the message in the status region", async () => {
    const user = userEvent.setup();
    renderWithMain();

    await user.click(
      screen.getByRole("button", { name: "show Staging deleted" }),
    );

    const alert = screen.getByTestId("api-key-alert");
    expect(screen.getByRole("status")).toContainElement(alert);
    expect(alert).toHaveClass("usa-alert--success", "usa-alert--slim");
    expect(alert).toHaveTextContent("Staging deleted");
  });

  it("replaces the alert rather than stacking when another is shown", async () => {
    const user = userEvent.setup();
    renderWithMain();

    await user.click(
      screen.getByRole("button", { name: "show Staging deleted" }),
    );
    await user.click(
      screen.getByRole("button", { name: "show Production deleted" }),
    );

    const alerts = screen.getAllByTestId("api-key-alert");
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toHaveTextContent("Production deleted");
  });

  it("removes the alert when it is hidden", async () => {
    const user = userEvent.setup();
    renderWithMain();

    await user.click(
      screen.getByRole("button", { name: "show Staging deleted" }),
    );
    await user.click(screen.getByRole("button", { name: "hide" }));

    expect(screen.queryByTestId("api-key-alert")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("moves focus to the main content when an alert is shown", async () => {
    const user = userEvent.setup();
    renderWithMain();

    await user.click(
      screen.getByRole("button", { name: "show Staging deleted" }),
    );

    await waitFor(() => {
      expect(screen.getByRole("main")).toHaveFocus();
    });
  });

  it("passes accessibility scan with the alert shown", async () => {
    const user = userEvent.setup();
    const { container } = renderWithMain();

    await user.click(
      screen.getByRole("button", { name: "show Staging deleted" }),
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
