import { render, screen } from "@testing-library/react";

import { RefObject } from "react";
import { ModalRef } from "@trussworks/react-uswds";

import { LoginModal } from "src/components/LoginModal";

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
});
