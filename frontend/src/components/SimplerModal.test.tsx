import { render, screen, fireEvent } from "@testing-library/react";
import { useRef } from "react";
import { ModalRef } from "@trussworks/react-uswds";

import { SimplerModal } from "./SimplerModal";

describe("SimplerModal", () => {
  const TestComponent = ({ onClose, forceAction, closeText, className }: { 
    onClose?: () => void;
    forceAction?: boolean;
    closeText?: string;
    className?: string;
  }) => {
    const modalRef = useRef<ModalRef>(null);
    return (
      <SimplerModal
        modalRef={modalRef}
        modalId="test-modal"
        title="Test Modal"
        onClose={onClose}
        forceAction={forceAction}
        closeText={closeText}
        className={className}
      >
        <p>Test content</p>
      </SimplerModal>
    );
  };

  it("renders with default props", () => {
    render(<TestComponent />);
    expect(screen.getByText("Test Modal")).toBeInTheDocument();
    expect(screen.getByText("Test content")).toBeInTheDocument();
    expect(screen.getByText("Close")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = jest.fn();
    render(<TestComponent onClose={onClose} />);
    fireEvent.click(screen.getByText("Close"));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when escape key is pressed", () => {
    const onClose = jest.fn();
    render(<TestComponent onClose={onClose} />);
    const modal = document.querySelector('[role="dialog"]');
    if (modal) {
      fireEvent.keyDown(modal, { key: "Escape" });
    }
    expect(onClose).toHaveBeenCalled();
  });

  it("renders with custom close text", () => {
    render(<TestComponent closeText="Cancel" />);
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<TestComponent className="custom-class" />);
    const modal = document.querySelector('[role="dialog"]');
    expect(modal).toHaveClass("custom-class");
  });

  it("does not close when forceAction is true and escape key is pressed", () => {
    const onClose = jest.fn();
    render(<TestComponent onClose={onClose} forceAction={true} />);
    const modal = document.querySelector('[role="dialog"]');
    if (modal) {
      fireEvent.keyDown(modal, { key: "Escape" });
    }
    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not close when forceAction is true and clicking outside", () => {
    const onClose = jest.fn();
    render(<TestComponent onClose={onClose} forceAction={true} />);
    const modal = document.querySelector('[role="dialog"]');
    if (modal) {
      fireEvent.mouseDown(modal);
    }
    expect(onClose).not.toHaveBeenCalled();
  });
}); 