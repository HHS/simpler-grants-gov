import { render, screen, within } from "@testing-library/react";

import { RefObject } from "react";
import { ModalRef } from "@trussworks/react-uswds";

import { LoginModal } from "src/components/core/loginModal/LoginModal";

describe("LoginModal", () => {
  const createModalRef = (): RefObject<ModalRef> => ({
    current: {
      modalId: "test-modal",
      modalIsOpen: false,
      toggleModal: jest.fn(),
      focus: jest.fn(),
    } as unknown as ModalRef,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the login modal", () => {
    const modalRef = createModalRef();
    render(
      <LoginModal
        modalRef={modalRef}
        helpText="Help text"
        titleText="Login"
        descriptionText="Please login"
        buttonText="Sign In"
        closeText="Close"
        modalId="login-modal"
      />,
    );

    expect(screen.getByText("Sign In")).toBeInTheDocument();
    expect(screen.getByText("Close")).toBeInTheDocument();
  });

  it("should render the login button with custom text", () => {
    const modalRef = createModalRef();
    const customButtonText = "Custom Login Text";

    render(
      <LoginModal
        modalRef={modalRef}
        helpText="Help text"
        titleText="Login"
        descriptionText="Please login"
        buttonText={customButtonText}
        closeText="Close"
        modalId="login-modal"
      />,
    );

    expect(screen.getByText(customButtonText)).toBeInTheDocument();
  });

  it("exposes the footer actions without wrapping them in list semantics", () => {
    const modalRef = createModalRef();

    render(
      <LoginModal
        modalRef={modalRef}
        helpText="Help text"
        titleText="Login"
        descriptionText="Please login"
        buttonText="Sign In"
        closeText="Close"
        modalId="login-modal"
      />,
    );

    const modal = within(screen.getByRole("dialog"));
    expect(modal.getByRole("link", { name: "Sign In" })).toBeInTheDocument();
    expect(modal.getByRole("button", { name: "Close" })).toBeInTheDocument();

    expect(modal.queryByRole("list")).not.toBeInTheDocument();
    expect(modal.queryAllByRole("listitem")).toHaveLength(0);
  });

  it("keeps the decorative launch icon out of the CTA's accessible name", () => {
    const modalRef = createModalRef();

    render(
      <LoginModal
        modalRef={modalRef}
        helpText="Help text"
        titleText="Login"
        descriptionText="Please login"
        buttonText="Sign In"
        closeText="Close"
        modalId="login-modal"
      />,
    );

    expect(screen.getByRole("link", { name: "Sign In" })).toHaveAccessibleName(
      "Sign In",
    );
  });
});
