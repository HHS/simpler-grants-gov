"use client";

import { ReactNode, useRef } from "react";
import {
  ModalFooter,
  ModalHeading,
  ModalRef,
  ModalToggleButton,
} from "@trussworks/react-uswds";

import { Drawer } from "./Drawer";
import { DrawerControl } from "./DrawerControl";

export function DrawerUnit({
  drawerId,
  children,
  buttonText,
  headingText,
}: {
  drawerId: string;
  children: ReactNode;
  buttonText: string;
  headingText: string;
}) {
  const drawerRef = useRef<ModalRef>(null);
  return (
    <>
      <Drawer drawerRef={drawerRef} drawerId={drawerId}>
        <div className="width-full display-flex flex-column maxh-tablet">
          <div className="flex-1">
            <ModalHeading id={`${drawerId}-heading`}>
              {headingText}
            </ModalHeading>
          </div>
          <div className="overflow-auto border-top-05 flex-8 border-bottom-05 border-base-lightest padding-bottom-1">
            {children}
          </div>
          <div className="flex-1">
            <ModalFooter>
              <ModalToggleButton
                modalRef={drawerRef}
                secondary
                className="width-full"
              >
                {buttonText}
              </ModalToggleButton>
            </ModalFooter>
          </div>
        </div>
      </Drawer>
      <DrawerControl drawerRef={drawerRef} />
    </>
  );
}
