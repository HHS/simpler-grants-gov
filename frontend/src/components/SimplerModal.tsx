import { RefObject } from "react";
import { Modal, ModalRef, ModalHeading } from "@trussworks/react-uswds";

interface SimplerModalProps {
  modalRef: RefObject<ModalRef>;
  modalId: string;
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
  closeText?: string;
  forceAction?: boolean;
  className?: string;
}

export const SimplerModal = ({
  modalRef,
  modalId,
  title,
  children,
  onClose,
  closeText = "Close",
  forceAction = false,
  className,
}: SimplerModalProps) => {
  return (
    <Modal
      ref={modalRef}
      id={modalId}
      forceAction={forceAction}
      className={className}
    >
      <ModalHeading id={`${modalId}-heading`}>{title}</ModalHeading>
      {children}
    </Modal>
  );
}; 