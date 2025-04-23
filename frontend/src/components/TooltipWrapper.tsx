"use client";

import { ForwardRefExoticComponent, ReactNode } from "react";
import { Tooltip } from "@trussworks/react-uswds";

type TooltipProps = {
  label: ReactNode;
  title?: string;
  position?: "top" | "bottom" | "left" | "right";
  wrapperclasses?: string;
  className?: string;
  children: ReactNode;
  asCustom?: ForwardRefExoticComponent<
    Omit<React.HTMLProps<HTMLElement>, "ref"> & React.RefAttributes<HTMLElement>
  >;
};

export const TooltipWrapper = (props: TooltipProps) => {
  return <Tooltip {...props} aria-label={props.title} />;
};

export default TooltipWrapper;
