"use client";

import { UswdsIconNames } from "src/types/generalTypes";

import { ReactNode, useRef } from "react";
import { ModalRef } from "@trussworks/react-uswds";

import { Drawer } from "./Drawer";
import { DrawerControl } from "./DrawerControl";

// largely state / ref management for a modal / drawer setup defined in child components and passed children
export function DrawerUnit({
  drawerId,
  children,
  closeText,
  openText,
  headingText,
  iconName,
  buttonClass,
}: {
  drawerId: string;
  children: ReactNode;
  closeText: string;
  openText: string;
  headingText: string | ReactNode;
  iconName?: UswdsIconNames;
  buttonClass?: string;
}) {
  const drawerRef = useRef<ModalRef>(null);
  return (
    <>
      <Drawer
        drawerRef={drawerRef}
        drawerId={drawerId}
        headingText={headingText}
        closeText={closeText}
      >
        {children}
      </Drawer>
      <DrawerControl
        drawerRef={drawerRef}
        buttonText={openText}
        iconName={iconName}
        className={buttonClass}
      />
    </>
  );
}
