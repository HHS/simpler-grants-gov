import { useIsSSR } from "src/hooks/useIsSSR";

import { ReactNode, RefObject } from "react";
import { Modal, ModalHeading, ModalRef } from "@trussworks/react-uswds";

export function SimplerModal({
  modalRef,
  className,
  modalId,
  titleText,
  children,
}: {
  modalRef: RefObject<ModalRef>;
  titleText?: string;
  modalId: string;
  className?: string;
  children: ReactNode;
}) {
  const isSSR = useIsSSR();
  return (
    <Modal
      ref={modalRef}
      forceAction={false}
      className={className}
      aria-labelledby={`${modalId}-heading`}
      aria-describedby={`${modalId}-description`}
      id={modalId}
      renderToPortal={!isSSR}
    >
      <ModalHeading id={`${modalId}-heading`}>{titleText}</ModalHeading>
      {children}
    </Modal>
  );
}
