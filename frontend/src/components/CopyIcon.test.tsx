import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

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
    render(<CopyIcon content="test-content" />);

    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
  });

  it("copies content to clipboard on click", async () => {
    render(<CopyIcon content="my-secret-key" />);

    fireEvent.click(screen.getByRole("button", { name: "Copy" }));

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith("my-secret-key");
    });
  });

  it("shows check icon after clicking, then reverts after 2 seconds", async () => {
    render(<CopyIcon content="test-content" />);

    fireEvent.click(screen.getByRole("button", { name: "Copy" }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Copied" }),
      ).toBeInTheDocument();
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
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

    render(<CopyIcon content="test-content" />);

    fireEvent.click(screen.getByRole("button", { name: "Copy" }));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error copying to clipboard",
        expect.any(Error),
      );
    });

    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});
