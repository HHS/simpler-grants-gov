import { fireEvent, render, screen } from "@testing-library/react";

import React from "react";

import { TransferOwnershipButton } from "./TransferOwnershipButton";

jest.mock("@trussworks/react-uswds", () => ({
  Button: ({
    children,
    onClick,
    className,
    type,
    secondary,
    unstyled,
    "data-testid": dataTestId,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    type?: "button" | "submit" | "reset";
    secondary?: boolean;
    unstyled?: boolean;
    "data-testid"?: string;
  }) => (
    <button
      type={type ?? "button"}
      className={className}
      data-testid={dataTestId}
      onClick={onClick}
      data-secondary={String(Boolean(secondary))}
      data-unstyled={String(Boolean(unstyled))}
    >
      {children}
    </button>
  ),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock("src/components/USWDSIcon", () => ({
  USWDSIcon: () => <span aria-hidden="true" />,
}));

describe("TransferOwnershipButton", () => {
  it("calls onClick when pressed", () => {
    const onClickMock = jest.fn();

    render(<TransferOwnershipButton onClick={onClickMock} />);

    fireEvent.click(screen.getByTestId("transfer-ownership-open"));

    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  it("renders the label from translations", () => {
    render(<TransferOwnershipButton onClick={jest.fn()} />);

    expect(
      screen.getByText("transferApplicaitonOwnership"),
    ).toBeInTheDocument();
  });
});
