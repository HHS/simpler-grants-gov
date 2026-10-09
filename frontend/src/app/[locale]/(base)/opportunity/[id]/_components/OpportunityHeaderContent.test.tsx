import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { noop } from "lodash";

import { createRef } from "react";

import { OpportunityHeaderContent } from "./OpportunityHeaderContent";

// note that next-intl is mocked globally, translations render as their keys

let mockUser: { token?: string } = {};
const clientFetchMock = jest.fn();

jest.mock("src/services/auth/useUser", () => ({
  useUser: () => ({ user: mockUser }),
}));

jest.mock("src/hooks/useClientFetch", () => ({
  useClientFetch: () => ({
    clientFetch: (...args: unknown[]) => clientFetchMock(...args) as unknown,
  }),
}));

jest.mock("src/hooks/useIsSSR", () => ({
  useIsSSR: () => false,
}));

jest.mock("src/services/auth/LoginModalProvider", () => ({
  useLoginModal: () => ({
    loginModalRef: createRef(),
    setButtonText: noop,
    setCloseText: noop,
    setDescriptionText: noop,
    setHelpText: noop,
    setTitleText: noop,
  }),
}));

const SAVE_NAME = "saveButton.save saveButton.accessibleContext";
const SAVED_NAME = "saveButton.saved saveButton.accessibleContext";

const renderHeader = (opportunitySaved = false) =>
  render(
    <OpportunityHeaderContent
      opportunityId="opp-1"
      opportunitySaved={opportunitySaved}
      opportunityTitle="Test Opportunity"
      details={<p>details</p>}
      applyAction={<a href="https://www.grants.gov">apply</a>}
    />,
  );

// resolves the save request when the test is ready
const deferredRequest = () => {
  let resolveRequest: (value: { type: string }) => void = noop;
  clientFetchMock.mockReturnValue(
    new Promise((resolve) => {
      resolveRequest = resolve;
    }),
  );
  return {
    resolve: (value: { type: string }) => resolveRequest(value),
  };
};

describe("OpportunityHeaderContent", () => {
  beforeEach(() => {
    mockUser = { token: "a token" };
    jest.spyOn(console, "error").mockImplementation(noop);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("renders the opportunity title as the page heading", () => {
    renderHeader();
    expect(
      screen.getByRole("heading", { level: 1, name: "Test Opportunity" }),
    ).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderHeader();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("tells screen reader users which opportunity the save button is for", () => {
    renderHeader();
    const button = screen.getByRole("button", { name: SAVE_NAME });
    expect(
      within(button).getByText("saveButton.accessibleContext"),
    ).toHaveClass("usa-sr-only");
  });

  it("shows an updating state that keeps focus on the button while saving", async () => {
    const request = deferredRequest();
    renderHeader();

    const button = screen.getByRole("button", { name: SAVE_NAME });
    await userEvent.click(button);

    expect(button).toHaveTextContent("saveButton.loading");
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).toHaveFocus();

    // a second click while the request is running does not send another request
    await userEvent.click(button);
    expect(clientFetchMock).toHaveBeenCalledTimes(1);

    request.resolve({ type: "save" });
    await waitFor(() =>
      expect(button).toHaveAttribute("aria-disabled", "false"),
    );
  });

  it("saves the opportunity and announces the result after the call to action buttons", async () => {
    clientFetchMock.mockResolvedValue({ type: "save" });
    renderHeader();

    await userEvent.click(screen.getByRole("button", { name: SAVE_NAME }));

    expect(clientFetchMock).toHaveBeenCalledWith(
      "/api/user/saved-opportunities",
      { method: "POST", body: JSON.stringify({ opportunityId: "opp-1" }) },
    );
    expect(
      await screen.findByRole("button", { name: SAVED_NAME }),
    ).toBeInTheDocument();

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("saveMessage.save");
    // reading and tab order: the message comes after both call to action buttons
    expect(
      screen
        .getByRole("link", { name: "apply" })
        .compareDocumentPosition(status) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("unsaves the opportunity and announces the result", async () => {
    clientFetchMock.mockResolvedValue({ type: "unsave" });
    renderHeader(true);

    await userEvent.click(screen.getByRole("button", { name: SAVED_NAME }));

    expect(clientFetchMock).toHaveBeenCalledWith(
      "/api/user/saved-opportunities",
      { method: "DELETE", body: JSON.stringify({ opportunityId: "opp-1" }) },
    );
    expect(
      await screen.findByRole("button", { name: SAVE_NAME }),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("saveMessage.unsave");
  });

  it("dismisses the save message and returns focus to the save button", async () => {
    clientFetchMock.mockResolvedValue({ type: "save" });
    renderHeader();

    await userEvent.click(screen.getByRole("button", { name: SAVE_NAME }));
    await userEvent.click(
      await screen.findByRole("button", { name: "saveMessage.dismiss" }),
    );

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    expect(screen.getByRole("button", { name: SAVED_NAME })).toHaveFocus();
  });

  it("gives the save message a named dismiss button that can be reached and used with the keyboard", async () => {
    clientFetchMock.mockResolvedValue({ type: "save" });
    const { container } = renderHeader();

    await userEvent.click(screen.getByRole("button", { name: SAVE_NAME }));

    // the message is announced through the status region
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("saveMessage.save");

    const dismiss = within(status).getByRole("button", {
      name: "saveMessage.dismiss",
    });
    expect(dismiss.tagName).toBe("BUTTON");
    // the message isn't described by the save button, which would expose its container to
    // screen readers with the save button's name around the dismiss button
    expect(screen.getByTestId("simpler-alert")).not.toHaveAttribute(
      "aria-describedby",
    );
    expect(dismiss).toHaveAccessibleDescription("");
    expect(await axe(container)).toHaveNoViolations();

    // the dismiss button follows the call to action buttons in tab order
    screen.getByRole("link", { name: "apply" }).focus();
    await userEvent.tab();
    expect(dismiss).toHaveFocus();

    await userEvent.keyboard("{Enter}");
    expect(status).toBeEmptyDOMElement();
    expect(screen.getByRole("button", { name: SAVED_NAME })).toHaveFocus();
  });

  it("shows an error above the title when saving fails", async () => {
    clientFetchMock.mockRejectedValue(new Error("save failed"));
    renderHeader();

    await userEvent.click(screen.getByRole("button", { name: SAVE_NAME }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("saveMessage.errorSave");
    expect(
      alert.compareDocumentPosition(screen.getByRole("heading", { level: 1 })) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    // the opportunity is still unsaved, and no success message is shown
    expect(screen.getByRole("button", { name: SAVE_NAME })).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("shows an error when unsaving fails", async () => {
    clientFetchMock.mockRejectedValue(new Error("unsave failed"));
    renderHeader(true);

    await userEvent.click(screen.getByRole("button", { name: SAVED_NAME }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "saveMessage.errorUnsave",
    );
    expect(
      screen.getByRole("button", { name: SAVED_NAME }),
    ).toBeInTheDocument();
  });

  it("clears a previous error when trying again succeeds", async () => {
    clientFetchMock.mockRejectedValueOnce(new Error("save failed"));
    clientFetchMock.mockResolvedValueOnce({ type: "save" });
    renderHeader();

    await userEvent.click(screen.getByRole("button", { name: SAVE_NAME }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: SAVE_NAME }));

    expect(
      await screen.findByRole("button", { name: SAVED_NAME }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("saveMessage.save");
  });

  it("prompts signed out users to sign in rather than saving, with the same screen reader context", async () => {
    mockUser = {};
    renderHeader();

    const button = screen.getByRole("button", { name: SAVE_NAME });
    expect(button).not.toHaveAttribute("data-testid", "simpler-save-button");

    await userEvent.click(button);
    expect(clientFetchMock).not.toHaveBeenCalled();
  });
});
