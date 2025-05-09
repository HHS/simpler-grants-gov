import { fireEvent, render, screen } from "@testing-library/react";

import { RefObject } from "react";
import { ModalRef } from "@trussworks/react-uswds/lib/components/Modal/Modal";

import { LoginModal } from "src/components/LoginModal";

const mockSetItem = jest.fn<void, [string, string]>();

jest.mock("src/services/auth/sessionStorage", () => {
  return {
    __esModule: true,
    default: {
      setItem: (key: string, value: string): void => mockSetItem(key, value),
    },
  };
});

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

  it("should store the current URL in session storage when clicking sign in", () => {
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

    const signInButton = screen.getByText("Sign In");
    fireEvent.click(signInButton);

    expect(mockSetItem).toHaveBeenCalledWith(
      "login-redirect",
      "/test-path?param=value",
    );
  });
});
