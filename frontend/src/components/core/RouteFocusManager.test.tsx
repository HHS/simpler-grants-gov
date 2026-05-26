import { render, screen } from "@testing-library/react";

import "@testing-library/jest-dom";

import RouteFocusManager from "./RouteFocusManager";

const mockUsePathname = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname() as string,
}));

describe("RouteFocusManager", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not move focus on initial render", () => {
    mockUsePathname.mockReturnValue("/example-route");

    render(
      <RouteFocusManager>
        <main id="main-content" tabIndex={-1} data-testid="main">
          Page content (example route)
        </main>
      </RouteFocusManager>,
    );

    const main = screen.getByTestId("main");

    expect(main).toBeInTheDocument();
    expect(main).not.toHaveFocus();
  });

  it("moves focus to main content after route change", () => {
    mockUsePathname.mockReturnValue("/first-route");

    const { rerender } = render(
      <RouteFocusManager>
        <main id="main-content" tabIndex={-1} data-testid="main">
          Page content (first route)
        </main>
      </RouteFocusManager>,
    );

    const main = screen.getByTestId("main");

    expect(main).toBeInTheDocument();
    expect(main).not.toHaveFocus();

    mockUsePathname.mockReturnValue("/second-route");

    rerender(
      <RouteFocusManager>
        <main id="main-content" tabIndex={-1}>
          New page content (second route)
        </main>
      </RouteFocusManager>,
    );

    expect(main).toHaveFocus();
  });

  it("does not throw if main content is missing", () => {
    mockUsePathname.mockReturnValue("/third-route");

    const { rerender } = render(
      <RouteFocusManager>
        <div>Page content (third route)</div>
      </RouteFocusManager>,
    );

    mockUsePathname.mockReturnValue("/fourth-route");

    expect(() => {
      rerender(
        <RouteFocusManager>
          <div>New page content (fourth route)</div>
        </RouteFocusManager>,
      );
    }).not.toThrow();
  });
});
