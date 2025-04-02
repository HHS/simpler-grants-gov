import { fireEvent, render, screen } from "@testing-library/react";
import SessionStorage from "src/utils/sessionStorage";

import { RefObject } from "react";
import { ModalRef } from "@trussworks/react-uswds/lib/components/Modal/Modal";

import { LoginModal } from "src/components/LoginModal";

jest.mock("src/utils/sessionStorage", () => ({
  __esModule: true,
  default: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    isSessionStorageAvailable: jest.fn().mockReturnValue(true),
  },
}));

const mockLocation = {
  pathname: "/test-path",
  search: "?param=value",
};

// Save the original location
const originalLocation = global.location;

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
    Object.defineProperty(global, "location", {
      configurable: true,
      value: { ...mockLocation },
      writable: true,
    });

    jest.clearAllMocks();
  });

  afterAll(() => {
    Object.defineProperty(global, "location", {
      configurable: true,
      value: originalLocation,
      writable: true,
    });
  });

  it("should store current URL in session storage when login button is clicked", () => {
    const modalRef = createModalRef();
    const setItemSpy = jest
      .spyOn(SessionStorage, "setItem")
      .mockImplementation((): void => undefined);

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

    const loginButton = screen.getByText("Sign In");
    fireEvent.click(loginButton);

    expect(setItemSpy).toHaveBeenCalledWith(
      "login-redirect",
      "/test-path?param=value",
    );
  });

  it("should not store URL in session storage if pathname and search are empty", () => {
    const modalRef = createModalRef();
    const setItemSpy = jest
      .spyOn(SessionStorage, "setItem")
      .mockImplementation((): void => undefined);

    Object.defineProperty(global, "location", {
      configurable: true,
      value: { pathname: "", search: "" },
      writable: true,
    });

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

    const loginButton = screen.getByText("Sign In");
    fireEvent.click(loginButton);

    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it("should render the login button with correct text", () => {
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
