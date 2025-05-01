import { RefObject } from "react";
import {
  Modal,
  ModalFooter,
  ModalHeading,
  ModalRef,
  ModalToggleButton,
} from "@trussworks/react-uswds";

import { USWDSIcon } from "./USWDSIcon";

interface SimplerModalProps {
  modalRef: RefObject<ModalRef | null>;
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
  forceAction = true,
  className = "text-wrap",
}: SimplerModalProps) => {
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <Modal
      ref={modalRef}
      forceAction={forceAction}
      className={className}
      aria-labelledby={`${modalId}-heading`}
      aria-describedby={`${modalId}-description`}
      id={modalId}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          handleClose();
        }
      }}
    >
      <div className="position-relative">
        <ModalToggleButton
          modalRef={modalRef}
          closer
          unstyled
          className="position-absolute right-0 top-0 padding-1"
          onClick={handleClose}
        >
          <USWDSIcon name="close" />
        </ModalToggleButton>
        <ModalHeading id={`${modalId}-heading`}>{title}</ModalHeading>
        {children}
        <ModalFooter>
          <ModalToggleButton
            modalRef={modalRef}
            closer
            unstyled
            className="padding-105 text-center"
            onClick={handleClose}
          >
            {closeText}
          </ModalToggleButton>
        </ModalFooter>
      </div>
    </Modal>
  );
}; 