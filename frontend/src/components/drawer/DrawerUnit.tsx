"use client";

import { ReactNode, useRef } from "react";
import { ModalRef } from "@trussworks/react-uswds";

import { Drawer } from "./Drawer";
import { DrawerControl } from "./DrawerControl";

export function DrawerUnit({
  drawerId,
  children,
}: {
  drawerId: string;
  children: ReactNode;
}) {
  const drawerRef = useRef<ModalRef>(null);
  return (
    <>
      <Drawer drawerRef={drawerRef} drawerId={drawerId}>
        {children}
      </Drawer>
      <DrawerControl drawerRef={drawerRef} />
    </>
  );
}
