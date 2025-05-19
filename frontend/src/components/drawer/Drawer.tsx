import { useIsSSR } from "src/hooks/useIsSSR";

import { ReactNode, RefObject } from "react";
import { Modal, ModalRef } from "@trussworks/react-uswds";

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
      forceAction={false}
      className="text-wrap height-full margin-0 radius-0"
      aria-labelledby={`${drawerId}-heading`}
      aria-describedby={`${drawerId}-description`}
      id={drawerId}
      renderToPortal={!isSSR}
    >
      {children}
    </Modal>
  );
}
