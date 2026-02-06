import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { TransferOwnershipButton } from "./TransferOwnershipButton";

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock("src/components/USWDSIcon", () => ({
  USWDSIcon: () => <span aria-hidden="true" />,
}));

describe("TransferOwnershipButton", () => {
  it("calls onClick when pressed", async () => {
    const user = userEvent.setup();
    const onClickMock = jest.fn();

    render(<TransferOwnershipButton onClick={onClickMock} />);

    await user.click(screen.getByTestId("transfer-ownership-open"));
    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  it("renders the label from translations", () => {
    render(<TransferOwnershipButton onClick={jest.fn()} />);
    expect(screen.getByText("transferApplicaitonOwnership")).toBeInTheDocument();
  });
});
