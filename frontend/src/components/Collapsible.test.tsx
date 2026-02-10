import { render, screen } from "@testing-library/react";
import { act } from "react";
import React from "react";

import { Collapsible } from "./Collapsible";

describe("Collapsible", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.resetAllMocks();
  });

  it("renders children when isOpen=true", () => {
    render(
      <Collapsible isOpen={true} testId="collapsible">
        <div>Inner content</div>
      </Collapsible>,
    );

    expect(screen.getByTestId("collapsible")).toHaveAttribute(
      "aria-hidden",
      "false",
    );
    expect(screen.getByText("Inner content")).toBeInTheDocument();
  });

  it("sets aria-hidden=true when isOpen=false", () => {
    render(
      <Collapsible isOpen={false} testId="collapsible">
        <div>Inner content</div>
      </Collapsible>,
    );

    expect(screen.getByTestId("collapsible")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("adds base and state classes, plus optional className", () => {
    render(
      <Collapsible isOpen={true} className="extra-class" testId="collapsible">
        <div>Inner content</div>
      </Collapsible>,
    );

    const root = screen.getByTestId("collapsible");
    expect(root).toHaveClass("collapsible");
    expect(root).toHaveClass("is-expanded");
    expect(root).toHaveClass("extra-class");
  });

  it("keeps children mounted briefly after closing, then unmounts after durationInMs", () => {
    const { rerender } = render(
      <Collapsible isOpen={true} durationInMs={300} testId="collapsible">
        <div>Inner content</div>
      </Collapsible>,
    );

    expect(screen.getByText("Inner content")).toBeInTheDocument();

    // close it
    rerender(
      <Collapsible isOpen={false} durationInMs={300} testId="collapsible">
        <div>Inner content</div>
      </Collapsible>,
    );

    // Immediately after closing: still mounted for exit animation
    expect(screen.getByText("Inner content")).toBeInTheDocument();
    expect(screen.getByTestId("collapsible")).toHaveClass("is-collapsed");

    // Not unmounted before duration elapses
    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(screen.getByText("Inner content")).toBeInTheDocument();

    // Unmounted after duration
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(screen.queryByText("Inner content")).not.toBeInTheDocument();
  });

  it("does not unmount children on close when unmountOnExit=false", () => {
    const { rerender } = render(
      <Collapsible isOpen={true} unmountOnExit={false} testId="collapsible">
        <div>Inner content</div>
      </Collapsible>,
    );

    expect(screen.getByText("Inner content")).toBeInTheDocument();

    // close it
    rerender(
      <Collapsible isOpen={false} unmountOnExit={false} testId="collapsible">
        <div>Inner content</div>
      </Collapsible>,
    );

    // Should remain mounted indefinitely
    act(() => {
      jest.advanceTimersByTime(10_000);
    });
    expect(screen.getByText("Inner content")).toBeInTheDocument();
  });

  it("remounts children immediately if re-opened before the timeout completes", () => {
    const { rerender } = render(
      <Collapsible isOpen={true} durationInMs={300} testId="collapsible">
        <div>Inner content</div>
      </Collapsible>,
    );

    // close it
    rerender(
      <Collapsible isOpen={false} durationInMs={300} testId="collapsible">
        <div>Inner content</div>
      </Collapsible>,
    );

    // partially through exit
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(screen.getByText("Inner content")).toBeInTheDocument();

    // reopen before timer finishes
    rerender(
      <Collapsible isOpen={true} durationInMs={300} testId="collapsible">
        <div>Inner content</div>
      </Collapsible>,
    );

    // advance beyond original timeout;
    // it should NOT unmount
    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(screen.getByText("Inner content")).toBeInTheDocument();
    expect(screen.getByTestId("collapsible")).toHaveClass("is-expanded");
  });
});
