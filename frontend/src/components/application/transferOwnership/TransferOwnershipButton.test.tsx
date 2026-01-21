import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import { TransferOwnershipButton } from "./TransferOwnershipButton";

const toggleModalMock = jest.fn();

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

jest.mock(
  "src/components/application/transferOwnership/TransferOwnershipModal",
  () => ({
    TransferOwnershipModal: ({
      onAfterClose,
      modalRef,
    }: {
      onAfterClose: () => void;
      modalRef: React.RefObject<{ toggleModal?: () => void } | null>;
    }) => {
      // Simulate the modal having mounted and attaching to the ref
      if (modalRef.current === null) {
        // eslint-disable-next-line no-param-reassign
        (modalRef as React.MutableRefObject<{ toggleModal?: () => void } | null>)
          .current = {
          toggleModal: toggleModalMock,
        };
      }

      return (
        <div data-testid="transfer-ownership-modal">
          <button type="button" onClick={onAfterClose}>
            Close
          </button>
        </div>
      );
    },
  }),
);

describe("TransferOwnershipButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not render the modal until the button is clicked", () => {
    render(<TransferOwnershipButton applicationId="app-123" />);

    expect(
      screen.queryByTestId("transfer-ownership-modal"),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("transfer-ownership-open"));

    expect(
      screen.getByTestId("transfer-ownership-modal"),
    ).toBeInTheDocument();
  });

  it("unmounts the modal when onAfterClose is called", () => {
    render(<TransferOwnershipButton applicationId="app-123" />);

    fireEvent.click(screen.getByTestId("transfer-ownership-open"));
    expect(screen.getByTestId("transfer-ownership-modal")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Close"));

    expect(
      screen.queryByTestId("transfer-ownership-modal"),
    ).not.toBeInTheDocument();
  });

  it("toggles the modal open after it mounts", () => {
    render(<TransferOwnershipButton applicationId="app-123" />);

    fireEvent.click(screen.getByTestId("transfer-ownership-open"));
    expect(toggleModalMock).toHaveBeenCalledTimes(1);
  });
});
