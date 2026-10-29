import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
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

  // The modal is mounted on every page, so this untouched state is what ships in
  // the DOM of a typical page load. Empty defaults previously left an unlabeled
  // link, an unlabeled button, and a dangling aria-labelledby here.
  // https://github.com/HHS/simpler-grants-gov/issues/11493
  it("labels the modal before any consumer sets its text", () => {
    render(<LoginModalProvider />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAccessibleName("title");
    expect(dialog).toHaveAccessibleDescription("description");

    // The sign in link previously held nothing but an aria-hidden icon.
    expect(screen.getByRole("link")).toHaveAccessibleName("button");
    expect(screen.getByRole("button", { name: "close" })).toBeInTheDocument();
  });

  it("passes accessibility scan before any consumer sets its text", async () => {
    render(<LoginModalProvider />);
    // document.body, not the render container - Truss portals the modal out of it
    // once useIsSSR flips, leaving the container empty and the scan vacuous.
    const results = await waitFor(() => axe(document.body));
    expect(results).toHaveNoViolations();
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
