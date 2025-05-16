import { useIsSSR } from "src/hooks/useIsSSR";

// import { DrawerWrapper } from "./DrawerWrapper"
// import { DrawerWindow } from "./DrawerWindow"

import { ReactNode, RefObject } from "react";
import {
  Modal,
  ModalFooter,
  ModalHeading,
  ModalRef,
  ModalToggleButton,
} from "@trussworks/react-uswds";

export function Drawer({
  drawerRef,
  drawerId,
  children,
}: {
  drawerRef: RefObject<ModalRef | null>;
  drawerId: string;
  children: ReactNode;
}) {
  const isSSR = useIsSSR();

  return (
    <Modal
      ref={drawerRef}
      forceAction
      className="text-wrap"
      aria-labelledby={`${drawerId}-heading`}
      aria-describedby={`${drawerId}-description`}
      id={drawerId}
      renderToPortal={!isSSR}
    >
      <ModalHeading id={`${drawerId}-heading`}>titleText</ModalHeading>
      <div id={`${drawerId}-description`} className="usa-prose">
        {children}
      </div>
      <ModalFooter>
        <ModalToggleButton
          modalRef={drawerRef}
          closer
          unstyled
          className="padding-105 text-center"
        >
          close
        </ModalToggleButton>
      </ModalFooter>
    </Modal>
  );
}
