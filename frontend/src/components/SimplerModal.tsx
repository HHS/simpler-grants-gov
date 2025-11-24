import { useIsSSR } from "src/hooks/useIsSSR";

import { KeyboardEventHandler, ReactNode, RefObject } from "react";
import { Modal, ModalHeading, ModalRef } from "@trussworks/react-uswds";

import "react-dom";

/*

  SimplerModal

  Wrapper for the Truss Modal component that provides common functionality shared
  by all modals within the Simpler application.

  * avoids pre-render errors using isSSR hook
  * allows custom onClose functionality, which is not supported by Truss out of the box

*/

export function SimplerModal({
  modalRef,
  className,
  modalId,
  titleText,
  children,
  onKeyDown,
  onClose,
  onBlur,
}: {
  modalRef: RefObject<ModalRef | null>;
  titleText?: string;
  modalId: string;
  className?: string;
  children: ReactNode;
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
  onClose?: () => void;
  onBlur?: () => void;
}) {
  // The Modal component throws an error during SSR unless we specify that it should not "render to portal"
  // this hook allows us to opt out of that rendering behavior on the server
  const isSSR = useIsSSR();

  return (
    <Modal
      ref={modalRef}
      forceAction={false}
      className={className}
      aria-labelledby={`${modalId}-heading`}
      aria-describedby={`${modalId}-description`} // be sure that children includes a div with this id
      id={modalId}
      renderToPortal={!isSSR}
      onClick={(clickEvent) => {
        if (!onClose) {
          return;
        }
        const clickTarget = clickEvent.target as HTMLElement;
        if (clickTarget.className.includes("usa-modal__close")) {
          onClose();
        }
      }}
      onBlur={() => onBlur && onBlur()}
      onKeyDown={(keyEvent) => {
        if (onClose && keyEvent.key === "Escape") {
          onClose();
        }
        onKeyDown && onKeyDown(keyEvent);
      }}
    >
      {titleText && (
        <ModalHeading id={`${modalId}-heading`}>{titleText}</ModalHeading>
      )}
      {children}
    </Modal>
  );
}
