import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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
  it("calls onClick when clicked", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();

    render(<InlineActionLink onClick={onClick}>Do thing</InlineActionLink>);

    await user.click(screen.getByRole("button", { name: "Do thing" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
