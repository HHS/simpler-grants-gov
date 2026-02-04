import { fireEvent, render, screen } from "@testing-library/react";

import React from "react";

import { TransferOwnershipButton } from "./TransferOwnershipButton";

const onClickMock = jest.fn<void, []>();

jest.mock("@trussworks/react-uswds", () => ({
  Button: ({
    children,
    onClick,
    className,
    type,
    "data-testid": dataTestId,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    type?: "button" | "submit" | "reset";
    "data-testid"?: string;
  }) => (
    <button
      type={type ?? "button"}
      className={className}
      data-testid={dataTestId}
      onClick={onClick}
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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the transfer ownership button", () => {
    render(<TransferOwnershipButton onClick={onClickMock} />);

    const button = screen.getByTestId("transfer-ownership-open");
    expect(button).toBeInTheDocument();

    // We mock translations to return the key string.
    expect(
      screen.getByText("transferApplicaitonOwnership"),
    ).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    render(<TransferOwnershipButton onClick={onClickMock} />);

    fireEvent.click(screen.getByTestId("transfer-ownership-open"));

    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick on render", () => {
    render(<TransferOwnershipButton onClick={onClickMock} />);

    expect(onClickMock).not.toHaveBeenCalled();
  });
});