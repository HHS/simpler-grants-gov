import { fireEvent, render, screen } from "@testing-library/react";

import React from "react";

import { InlineActionLink } from "src/components/InlineActionLink";

jest.mock("@trussworks/react-uswds", () => ({
  Button: ({
    children,
    onClick,
    type,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    type?: "button" | "submit" | "reset";
  }) => (
    <button type={type ?? "button"} onClick={onClick}>
      {children}
    </button>
  ),
}));

describe("InlineActionLink", () => {
  it("calls onClick when clicked", () => {
    const onClickMock = jest.fn();

    render(<InlineActionLink onClick={onClickMock}>Click me</InlineActionLink>);

    fireEvent.click(screen.getByRole("button", { name: "Click me" }));

    expect(onClickMock).toHaveBeenCalledTimes(1);
  });
});
