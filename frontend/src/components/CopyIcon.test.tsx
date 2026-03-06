import { act, fireEvent, render, screen } from "@testing-library/react";

import CopyIcon from "src/components/CopyIcon";

const mockWriteText = jest.fn(() => Promise.resolve());

describe("CopyIcon", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders the copy icon by default", () => {
    const { container } = render(<CopyIcon content="test-content" />);

    const svg = container.querySelector("svg use");
    expect(svg).toHaveAttribute(
      "href",
      expect.stringContaining("content_copy"),
    );
  });

  it("copies content to clipboard on click", async () => {
    render(<CopyIcon content="my-secret-key" />);

    const button = screen.getByRole("button");
    await act(async () => {
      fireEvent.click(button);
      await Promise.resolve();
    });

    expect(mockWriteText).toHaveBeenCalledWith("my-secret-key");
  });

  it("shows check icon after clicking, then reverts after 2 seconds", async () => {
    const { container } = render(<CopyIcon content="test-content" />);

    const button = screen.getByRole("button");
    await act(async () => {
      fireEvent.click(button);
      await Promise.resolve();
    });

    const checkIcon = container.querySelector("svg use");
    expect(checkIcon).toHaveAttribute("href", expect.stringContaining("check"));

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    const copyIcon = container.querySelector("svg use");
    expect(copyIcon).toHaveAttribute(
      "href",
      expect.stringContaining("content_copy"),
    );
  });

  it("applies custom className to the button", () => {
    render(<CopyIcon content="test" className="custom-class" />);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("custom-class");
  });

  it("renders as an unstyled button", () => {
    render(<CopyIcon content="test" />);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("type", "button");
  });

  it("does not show check icon when clipboard write fails", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    mockWriteText.mockRejectedValueOnce(new Error("Permission denied"));

    const { container } = render(<CopyIcon content="test-content" />);

    const button = screen.getByRole("button");
    await act(async () => {
      fireEvent.click(button);
      await Promise.resolve();
    });

    const icon = container.querySelector("svg use");
    expect(icon).toHaveAttribute(
      "href",
      expect.stringContaining("content_copy"),
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error copying to clipboard",
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });
});
