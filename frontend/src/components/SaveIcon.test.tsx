import { fireEvent, render, screen } from "@testing-library/react";

import SaveIcon from "src/components/SaveIcon";

describe("SaveIcon", () => {
  it("renders without errors", () => {
    render(<SaveIcon />);
    const icon = screen.getByRole("img", { hidden: true });
    expect(icon).toBeInTheDocument();
  });

  it("shows star_outline icon when not saved", () => {
    render(<SaveIcon saved={false} />);
    const icon = screen.getByRole("img", { hidden: true });
    expect(icon).toHaveClass("usa-icon");
  });

  it("shows star icon when saved", () => {
    render(<SaveIcon saved={true} />);
    const icon = screen.getByRole("img", { hidden: true });
    expect(icon).toHaveClass("usa-icon");
  });

  it("applies icon-active class when saved", () => {
    render(<SaveIcon saved={true} />);
    const icon = screen.getByRole("img", { hidden: true });
    expect(icon).toHaveClass("icon-active");
  });

  it("shows spinner when loading", () => {
    render(<SaveIcon loading={true} />);
    const spinner = screen.getByRole("progressbar");
    expect(spinner).toBeInTheDocument();
  });

  it("does not show icon when loading", () => {
    render(<SaveIcon loading={true} />);
    expect(screen.queryByRole("img", { hidden: true })).not.toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<SaveIcon className="custom-class" />);
    const icon = screen.getByRole("img", { hidden: true });
    expect(icon).toHaveClass("custom-class");
  });

  describe("when clickable", () => {
    it("renders as button when onClick is provided", () => {
      const onClick = jest.fn();
      render(<SaveIcon onClick={onClick} />);
      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("calls onClick when clicked", () => {
      const onClick = jest.fn();
      render(<SaveIcon onClick={onClick} />);
      const button = screen.getByRole("button");
      fireEvent.click(button);
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("has proper aria-label when not saved", () => {
      const onClick = jest.fn();
      render(<SaveIcon onClick={onClick} saved={false} />);
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "Save opportunity");
    });

    it("has proper aria-label when saved", () => {
      const onClick = jest.fn();
      render(<SaveIcon onClick={onClick} saved={true} />);
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "Remove from saved");
    });

    it("applies cursor pointer style to button", () => {
      const onClick = jest.fn();
      render(<SaveIcon onClick={onClick} />);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("cursor-pointer");
    });
  });

  describe("when not clickable", () => {
    it("renders icon directly without button wrapper", () => {
      render(<SaveIcon />);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      const icon = screen.getByRole("img", { hidden: true });
      expect(icon).toBeInTheDocument();
    });
  });
});
