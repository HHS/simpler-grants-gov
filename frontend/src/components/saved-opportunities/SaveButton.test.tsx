import { render, screen } from "@testing-library/react";

import SaveButton from "src/components/saved-opportunities/SaveButton";

const SaveButtonProps = {
  buttonClick: jest.fn(),
  messageClick: jest.fn(),
  buttonId: "save-button",
  defaultText: "Save",
  error: false,
  loading: false,
  loadingText: "Loading",
  message: false,
  messageText: "You have saved this item",
  saved: true,
  savedText: "Saved",
};

describe("SaveButton", () => {
  it("Renders without errors", () => {
    render(<SaveButton {...SaveButtonProps} />);
    const saveButton = screen.getByTestId("simpler-save-button");
    expect(saveButton).toBeInTheDocument();
    expect(screen.getByText("Saved")).toBeInTheDocument();
    expect(
      screen.queryByText("You have saved this item"),
    ).not.toBeInTheDocument();
  });

  it("Button click fires", () => {
    render(<SaveButton {...SaveButtonProps} />);
    const saveButton = screen.getByTestId("simpler-save-button");
    saveButton.click();
    expect(SaveButtonProps.buttonClick).toHaveBeenCalled();
  });
  it("Message shows and click fires", () => {
    const SaveButtonPropsWithMessage = Object.assign(SaveButtonProps, {
      message: true,
    });
    render(<SaveButton {...SaveButtonPropsWithMessage} />);
    expect(screen.getByText("You have saved this item")).toBeInTheDocument();
    const alert = screen.getByTestId("simpler-alert");
    expect(alert).toHaveClass("usa-alert--success");

    const saveMessageButton = screen.getByTestId("simpler-alert-close-button");
    saveMessageButton.click();
    expect(SaveButtonPropsWithMessage.messageClick).toHaveBeenCalled();
  });
  it("Error shows", () => {
    const SaveButtonPropsWithErrorMessage = Object.assign(SaveButtonProps, {
      message: true,
      error: true,
    });
    render(<SaveButton {...SaveButtonPropsWithErrorMessage} />);
    const alert = screen.getByTestId("simpler-alert");
    expect(alert).toHaveClass("usa-alert--error");
  });
  it("Loading shows", () => {
    const SaveButtonPropsLoading = Object.assign(SaveButtonProps, {
      loading: true,
    });
    render(<SaveButton {...SaveButtonPropsLoading} />);
    expect(screen.queryByText("Saved")).not.toBeInTheDocument();
    expect(screen.getByText("Loading")).toBeInTheDocument();
  });
  it("stays focusable but ignores clicks while loading", () => {
    const buttonClick = jest.fn();
    render(
      <SaveButton
        {...SaveButtonProps}
        loading={true}
        buttonClick={buttonClick}
      />,
    );
    const saveButton = screen.getByRole("button", { name: "Loading" });
    expect(saveButton).toBeEnabled();
    expect(saveButton).toHaveAttribute("aria-disabled", "true");
    saveButton.click();
    expect(buttonClick).not.toHaveBeenCalled();
  });
  it("adds visually hidden context to the button name", () => {
    render(
      <SaveButton
        {...SaveButtonProps}
        loading={false}
        accessibleContext="opportunity: Test Opportunity"
      />,
    );
    expect(
      screen.getByRole("button", {
        name: "Saved opportunity: Test Opportunity",
      }),
    ).toBeInTheDocument();
  });
});
