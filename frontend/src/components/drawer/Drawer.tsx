import { useIsSSR } from "src/hooks/useIsSSR";

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
  headingText,
  closeText,
  children, // to form the body content of the drawer
}: {
  drawerRef: RefObject<ModalRef | null>;
  drawerId: string;
  headingText: string | ReactNode;
  closeText: string;
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
      <div className="width-full display-flex flex-column height-full">
        <div className="flex-auto border-bottom-05 border-base-lightest padding-bottom-1">
          <ModalHeading id={`${drawerId}-heading`}>{headingText}</ModalHeading>
        </div>
        <div className="
          overflow-y-scroll  
          flex-fill 
          padding-right-2 
          padding-bottom-3 
          padding-left-05 
          margin-left-neg-05
        ">
          {children}
        </div>
        <div className="flex-auto border-top-05 border-base-lightest">
          <ModalFooter>
            <ModalToggleButton
              modalRef={drawerRef}
              secondary
              className="width-full"
              data-testid="close-drawer"
            >
              {closeText}
            </ModalToggleButton>
          </ModalFooter>
        </div>
      </div>
    </Modal>
  );
}
