import { render, screen, fireEvent } from "@testing-library/react";
import { useRef } from "react";
import { ModalRef } from "@trussworks/react-uswds";

import { SimplerModal } from "src/components/SimplerModal";

describe("SimplerModal", () => {
  const TestComponent = ({ onClose }: { onClose?: () => void }) => {
    const modalRef = useRef<ModalRef>(null);
    return (
      <SimplerModal
        modalRef={modalRef}
        modalId="test-modal"
        title="Test Modal"
        onClose={onClose}
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
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("renders with custom close text", () => {
    render(
      <SimplerModal
        modalRef={useRef<ModalRef>(null)}
        modalId="test-modal"
        title="Test Modal"
        closeText="Cancel"
      >
        <p>Test content</p>
      </SimplerModal>
    );
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(
      <SimplerModal
        modalRef={useRef<ModalRef>(null)}
        modalId="test-modal"
        title="Test Modal"
        className="custom-class"
      >
        <p>Test content</p>
      </SimplerModal>
    );
    expect(document.querySelector(".custom-class")).toBeInTheDocument();
  });
}); 