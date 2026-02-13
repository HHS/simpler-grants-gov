import userEvent from "@testing-library/user-event";
import { IndexType } from "src/types/generalTypes";
import { render, screen, waitFor } from "tests/react-utils";

import { useState } from "react";

import NavDropdown from "src/components/NavDropdown";

function ControlledNavDropdown() {
  const [activeIndex, setActiveIndex] = useState<IndexType>(null);
  return (
    <NavDropdown
      activeNavDropdownIndex={activeIndex}
      index={0}
      isCurrent={false}
      linkText="Menu"
      menuItems={[
        <a href="/a" key="a">
          Link A
        </a>,
      ]}
      setActiveNavDropdownIndex={setActiveIndex}
    />
  );
}

describe("NavDropdown", () => {
  it("opens and shows menu items", async () => {
    const user = userEvent.setup();
    render(<ControlledNavDropdown />);
    const button = screen.getByRole("button", { name: "Menu" });
    expect(button).toHaveAttribute("aria-expanded", "false");

    await user.click(button);

    await waitFor(() =>
      expect(button).toHaveAttribute("aria-expanded", "true"),
    );
    expect(screen.getByRole("link", { name: "Link A" })).toBeInTheDocument();
  });

  it("applies usa-current when isCurrent is true", () => {
    render(
      <NavDropdown
        activeNavDropdownIndex={null}
        index={0}
        isCurrent={true}
        linkText="Current"
        menuItems={[]}
        setActiveNavDropdownIndex={jest.fn()}
      />,
    );
    const button = screen.getByRole("button", { name: "Current" });
    expect(button).toHaveClass("usa-current");
  });
});
