import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";

import { PivRequiredModal } from "src/components/core/loginModal/PivRequiredModal";

describe("PivRequiredModal", () => {
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
});
