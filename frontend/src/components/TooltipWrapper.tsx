"use client";

import { ForwardedRef, ForwardRefExoticComponent, ReactNode } from "react";
import { Tooltip } from "@trussworks/react-uswds";

type TooltipProps = {
  label: ReactNode;
  title?: string;
  position?: "top" | "bottom" | "left" | "right" | undefined;
  wrapperclasses?: string;
  className?: string;
  children?: ReactNode;
  asCustom?: ForwardRefExoticComponent<Omit<React.HTMLProps<HTMLElement>, "ref"> & React.RefAttributes<HTMLElement>>;
};

export const TooltipWrapper = (props: TooltipProps) => {
  return <Tooltip aria-label={props.title} {...props} />;
};

export default TooltipWrapper;
