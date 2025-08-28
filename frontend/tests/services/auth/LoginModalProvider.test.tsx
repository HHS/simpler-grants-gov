import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  LoginModalProvider,
  useLoginModal,
} from "src/services/auth/LoginModalProvider";

import { ModalToggleButton } from "@trussworks/react-uswds";

describe("LoginModalProvider", () => {
  it("renders a login modal", () => {
    render(<LoginModalProvider />);
    expect(screen.getByTestId("modalWindow")).toBeInTheDocument();
  });
  it("allows for setting text values", () => {
    const Consumer = () => {
      const {
        setHelpText,
        setTitleText,
        setDescriptionText,
        setButtonText,
        setCloseText,
      } = useLoginModal();

      setHelpText("help");
      setTitleText("title");
      setDescriptionText("description");
      setButtonText("button");
      setCloseText("close");
      return <></>;
    };
    render(
      <LoginModalProvider>
        <Consumer />
      </LoginModalProvider>,
    );
    expect(screen.getByText("help")).toBeInTheDocument();
    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.getByText("description")).toBeInTheDocument();
    expect(screen.getByText("button")).toBeInTheDocument();
    expect(screen.getByText("close")).toBeInTheDocument();
  });
  it("sets up a situation where a button child can control the modal", async () => {
    const Consumer = () => {
      const { loginModalRef } = useLoginModal();

      // setHelpText("help");
      return (
        <ModalToggleButton data-testid="modal-toggle" modalRef={loginModalRef}>
          click me
        </ModalToggleButton>
      );
    };
    render(
      <LoginModalProvider>
        <Consumer />
      </LoginModalProvider>,
    );

    // expect(screen.getByText("help")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toHaveClass("is-hidden");
    const modalToggle = screen.getByTestId("modal-toggle");
    await userEvent.click(modalToggle);

    expect(screen.getByRole("dialog")).not.toHaveClass("is-hidden");
  });
});
