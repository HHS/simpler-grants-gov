import { noop } from "lodash";
import { useIsSSR } from "src/hooks/useIsSSR";

import { KeyboardEventHandler, ReactNode, RefObject } from "react";
import { Modal, ModalHeading, ModalRef } from "@trussworks/react-uswds";

export function SimplerModal({
  modalRef,
  className,
  modalId,
  titleText,
  children,
  onKeyDown,
}: {
  modalRef: RefObject<ModalRef | null>;
  titleText?: string;
  modalId: string;
  className?: string;
  children: ReactNode;
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
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
      onKeyDown={onKeyDown || noop}
    >
      {titleText && (
        <ModalHeading id={`${modalId}-heading`}>{titleText}</ModalHeading>
      )}
      {children}
    </Modal>
  );
}
