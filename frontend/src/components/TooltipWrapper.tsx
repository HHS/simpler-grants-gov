"use client";

import { ReactNode } from "react";
import { Tooltip } from "@trussworks/react-uswds";

type TooltipProps = {
  label: ReactNode;
  title?: string;
  position?: "top" | "bottom" | "left" | "right" | undefined;
  wrapperclasses?: string;
  className?: string;
  children: ReactNode;
};

export const TooltipWrapper = (props: TooltipProps) => {
  return <Tooltip aria-label={props.title} {...props} />;
};

export default TooltipWrapper;
