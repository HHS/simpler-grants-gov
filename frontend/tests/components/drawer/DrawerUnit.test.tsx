import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DrawerUnit } from "src/components/drawer/DrawerUnit";

describe("DrawerUnit", () => {
  it("controls modal state correctly", async () => {
    const { rerender } = render(
      <DrawerUnit
        closeText="close me"
        openText="open me"
        drawerId="drawer"
        headingText="heading"
      >
        <div>drawer content</div>
      </DrawerUnit>,
    );
    const content = screen.getByText("drawer content");
    const modal = screen.getByRole("dialog");

    expect(content).toBeInTheDocument();
    expect(modal).toHaveClass("is-hidden");

    const openButton = screen.getByText("open me");
    await userEvent.click(openButton);

    rerender(
      <DrawerUnit
        closeText="close me"
        openText="open me"
        drawerId="drawer"
        headingText="heading"
      >
        <div>drawer content</div>
      </DrawerUnit>,
    );

    expect(modal).not.toHaveClass("is-hidden");

    const closeButton = screen.getByText("close me");
    await userEvent.click(closeButton);
    rerender(
      <DrawerUnit
        closeText="close me"
        openText="open me"
        drawerId="drawer"
        headingText="heading"
      >
        <div>drawer content</div>
      </DrawerUnit>,
    );

    expect(modal).toHaveClass("is-hidden");
  });
});
