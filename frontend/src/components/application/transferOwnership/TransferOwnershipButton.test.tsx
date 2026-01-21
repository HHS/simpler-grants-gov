import { fireEvent, render, screen } from "@testing-library/react";

import { TransferOwnershipButton } from "./TransferOwnershipButton";

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock("@trussworks/react-uswds", () => ({
  ModalToggleButton: ({
    children,
    onClick,
    "data-testid": dataTestId,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    "data-testid"?: string;
  }) => (
    <button type="button" data-testid={dataTestId} onClick={onClick}>
      {children}
    </button>
  ),
}));

const transferOwnershipModalMock = jest.fn();

jest.mock(
  "src/components/application/transferOwnership/TransferOwnershipModal",
  () => ({
    TransferOwnershipModal: (props: { onAfterClose: () => void }) => {
      transferOwnershipModalMock(props);
      return (
        <div data-testid="transfer-ownership-modal">
          <button
            type="button"
            data-testid="close-modal"
            onClick={props.onAfterClose}
          >
            Close
          </button>
        </div>
      );
    },
  }),
);

describe("TransferOwnershipButton", () => {
  beforeEach(() => {
    transferOwnershipModalMock.mockClear();
  });

  it("does not render the modal until the button is clicked", () => {
    render(<TransferOwnershipButton applicationId="app-123" />);

    expect(
      screen.queryByTestId("transfer-ownership-modal"),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("transfer-ownership-open"));

    expect(screen.getByTestId("transfer-ownership-modal")).toBeInTheDocument();
    expect(transferOwnershipModalMock).toHaveBeenCalled();
  });

  it("unmounts the modal when onAfterClose is called", () => {
    render(<TransferOwnershipButton applicationId="app-123" />);

    fireEvent.click(screen.getByTestId("transfer-ownership-open"));
    expect(screen.getByTestId("transfer-ownership-modal")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("close-modal"));
    expect(
      screen.queryByTestId("transfer-ownership-modal"),
    ).not.toBeInTheDocument();
  });
});
