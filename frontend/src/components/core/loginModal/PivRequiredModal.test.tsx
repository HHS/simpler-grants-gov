import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import { StrictMode } from "react";

import { PivRequiredModal } from "src/components/core/loginModal/PivRequiredModal";

const mockUsePathname = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname() as string,
}));

describe("PivRequiredModal", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/");
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it("renders the dialog", () => {
    render(<PivRequiredModal />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  // This modal renders directly above the footer on every page, which is why WAVE
  // reported its dangling aria-describedby as a footer issue.
  // https://github.com/HHS/simpler-grants-gov/issues/11493
  it("describes the dialog with an element that exists", () => {
    render(<PivRequiredModal />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute(
      "aria-describedby",
      "piv-required-modal-description",
    );
    expect(dialog).toHaveAccessibleName("title");
    expect(dialog).toHaveAccessibleDescription("description");
  });

  it("passes accessibility scan", async () => {
    render(<PivRequiredModal />);
    // document.body, not the render container - Truss portals the modal out of it
    // once useIsSSR flips, leaving the container empty and the scan vacuous.
    const results = await waitFor(() => axe(document.body));
    expect(results).toHaveNoViolations();
  });

  describe("showPivError", () => {
    it("opens on mount when showPivError is true, including under Strict Mode", () => {
      sessionStorage.setItem("showPivError", "true");
      render(
        <StrictMode>
          <PivRequiredModal />
        </StrictMode>,
      );
      expect(screen.getByRole("dialog")).toHaveClass("is-visible");
    });

    it.each([undefined, "false"])(
      "stays closed when showPivError is %p",
      (value) => {
        if (value) sessionStorage.setItem("showPivError", value);
        render(<PivRequiredModal />);
        expect(screen.getByRole("dialog")).toHaveClass("is-hidden");
      },
    );

    // The modal lives in the shared layout, so it is already mounted on /login
    // when the flag is set and then client-side navigates to the destination.
    it("opens after navigating once the flag is set after mount", () => {
      mockUsePathname.mockReturnValue("/login");
      const { rerender } = render(<PivRequiredModal />);
      expect(screen.getByRole("dialog")).toHaveClass("is-hidden");

      sessionStorage.setItem("showPivError", "true");
      mockUsePathname.mockReturnValue("/search");
      rerender(<PivRequiredModal />);
      expect(screen.getByRole("dialog")).toHaveClass("is-visible");
    });

    it("stays open across further navigation while the flag is set", () => {
      sessionStorage.setItem("showPivError", "true");
      const { rerender } = render(<PivRequiredModal />);
      expect(screen.getByRole("dialog")).toHaveClass("is-visible");

      mockUsePathname.mockReturnValue("/search");
      rerender(<PivRequiredModal />);
      expect(screen.getByRole("dialog")).toHaveClass("is-visible");
    });

    it("clears the flag on close and does not reopen on later navigation", async () => {
      sessionStorage.setItem("showPivError", "true");
      const { rerender } = render(<PivRequiredModal />);
      expect(screen.getByRole("dialog")).toHaveClass("is-visible");

      await userEvent.click(
        screen.getByRole("button", { name: "Close this window" }),
      );
      expect(screen.getByRole("dialog")).toHaveClass("is-hidden");
      expect(sessionStorage.getItem("showPivError")).toBeNull();

      mockUsePathname.mockReturnValue("/search");
      rerender(<PivRequiredModal />);
      expect(screen.getByRole("dialog")).toHaveClass("is-hidden");
    });
  });
});
