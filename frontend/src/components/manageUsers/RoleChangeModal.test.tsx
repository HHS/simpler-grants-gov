import { fireEvent, render, screen } from "@testing-library/react";

import React, { ReactNode } from "react";

import "@testing-library/jest-dom";

import { useTranslationsMock } from "src/utils/testing/intlMocks";

import { RoleChangeModal } from "src/components/manageUsers/RoleChangeModal";

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

interface ModalFooterProps {
  children: ReactNode;
}

interface BasicButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

interface ModalToggleButtonProps extends BasicButtonProps {
  modalRef?: React.RefObject<unknown>;
  closer?: boolean;
  unstyled?: boolean;
}

interface ButtonGroupProps {
  children: ReactNode;
}

interface AlertProps {
  children: ReactNode;
  [key: string]: unknown;
}

jest.mock("@trussworks/react-uswds", () => {
  const ModalFooter = ({ children }: ModalFooterProps) => (
    <div className="usa-modal__footer" data-testid="modalFooter">
      {children}
    </div>
  );

  const Button = (props: BasicButtonProps) => {
    const { children, ...rest } = props;
    return (
      <button type="button" data-testid="button" {...rest}>
        {children}
      </button>
    );
  };

  const ModalToggleButton = (props: ModalToggleButtonProps) => {
    const { children, ...rest } = props;
    return (
      <button type="button" data-testid="button" {...rest}>
        {children}
      </button>
    );
  };

  const ButtonGroup = ({ children }: ButtonGroupProps) => (
    <ul className="usa-button-group">{children}</ul>
  );

  const Alert = ({ children, ...rest }: AlertProps) => {
    const testId =
      typeof rest["data-testid"] === "string" ? rest["data-testid"] : "alert";
    return (
      <div data-testid={testId} {...rest}>
        {children}
      </div>
    );
  };

  return {
    ModalFooter,
    Button,
    ModalToggleButton,
    ButtonGroup,
    Alert,
  };
});

interface SimplerModalProps {
  children: ReactNode;
}

const simplerModalMock = jest.fn<void, [SimplerModalProps]>();

jest.mock("src/components/SimplerModal", () => ({
  SimplerModal: (props: SimplerModalProps) => {
    simplerModalMock(props);
    return <div data-testid="simpler-modal">{props.children}</div>;
  },
}));

describe("RoleChangeModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders description including the next role name", () => {
    const modalRef = { current: null };
    const nextRoleName = "Organization Admin";

    render(
      <RoleChangeModal
        isSubmitting={false}
        modalRef={modalRef}
        nextRoleName={nextRoleName}
        onConfirm={() => undefined}
        onCancel={() => undefined}
      />,
    );

    expect(screen.getByTestId("simpler-modal")).toBeInTheDocument();
    expect(screen.getByText(`description ${nextRoleName}?`)).toBeVisible();
  });

  it("calls onConfirm when the confirm button is clicked", () => {
    const modalRef = { current: null };
    const onConfirm = jest.fn<void, []>();
    const onCancel = jest.fn<void, []>();

    render(
      <RoleChangeModal
        isSubmitting={false}
        modalRef={modalRef}
        nextRoleName="Viewer"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    const confirmButton = screen.getByRole("button", { name: "confirm" });
    fireEvent.click(confirmButton);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("calls onCancel when the cancel button is clicked", () => {
    const modalRef = { current: null };
    const onConfirm = jest.fn<void, []>();
    const onCancel = jest.fn<void, []>();

    render(
      <RoleChangeModal
        isSubmitting={false}
        modalRef={modalRef}
        nextRoleName="Viewer"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    const cancelButton = screen.getByRole("button", { name: "cancel" });
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("shows saving state and disables buttons when submitting", () => {
    const modalRef = { current: null };

    render(
      <RoleChangeModal
        isSubmitting={true}
        modalRef={modalRef}
        nextRoleName="Viewer"
        onConfirm={() => undefined}
        onCancel={() => undefined}
      />,
    );

    const cancelButton = screen.getByRole("button", { name: "cancel" });
    expect(cancelButton).toBeDisabled();
  });

  it("renders an error message when errorMessage is provided", () => {
    const modalRef = { current: null };

    render(
      <RoleChangeModal
        isSubmitting={false}
        modalRef={modalRef}
        nextRoleName="Viewer"
        onConfirm={() => undefined}
        onCancel={() => undefined}
        errorMessage="Role cannot be changed"
      />,
    );

    const alert = screen.getByTestId("role-change-error");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent("Role cannot be changed");
  });
});
