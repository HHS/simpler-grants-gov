import { fireEvent, render, screen } from "@testing-library/react";

import { PermissionsPageNav } from "./PermissionsPageNav";

const fields = [
  { href: "current-permissions", text: "Current Permissions" },
  { href: "update-permissions", text: "Update Permissions" },
];

describe("PermissionsPageNav", () => {
  const scrollIntoView = jest.fn();

  beforeEach(() => {
    scrollIntoView.mockClear();
    Element.prototype.scrollIntoView = scrollIntoView;
  });

  it("renders a link to each section", () => {
    render(<PermissionsPageNav title="On this page" fields={fields} />);

    expect(
      screen.getByRole("link", { name: "Current Permissions" }),
    ).toHaveAttribute("href", "#current-permissions");
    expect(
      screen.getByRole("link", { name: "Update Permissions" }),
    ).toHaveAttribute("href", "#update-permissions");
  });

  it("scrolls to the section without changing the URL hash", () => {
    render(
      <>
        <section
          id="update-permissions"
          tabIndex={-1}
          data-testid="update-section"
        />
        <PermissionsPageNav title="On this page" fields={fields} />
      </>,
    );

    const click = fireEvent.click(
      screen.getByRole("link", { name: "Update Permissions" }),
    );

    // fireEvent returns false when the default action was prevented
    expect(click).toBe(false);
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("update-section")).toHaveFocus();
  });
});
