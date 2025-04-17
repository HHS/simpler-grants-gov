"use client";

import { ReactNode, ElementType } from "react";
import { Tooltip } from "@trussworks/react-uswds";

type TooltipProps = {
  label: ReactNode;
  title?: string;
  position?: "top" | "bottom" | "left" | "right" | undefined;
  wrapperclasses?: string;
  className?: string;
  children: ReactNode;
  asCustom?: ElementType;
};

export const TooltipWrapper = ({
  label,
  title,
  position = "top",
  wrapperclasses,
  className,
  children,
  asCustom,
  ...rest
}: TooltipProps) => {
  

  return (

      <Tooltip
        aria-label={title}
        title={title}
        position={position}
        wrapperclasses={`usa-tooltip ${wrapperclasses || ""}`}
        className={className}
        {...(asCustom ? { asCustom } : {})}
        {...rest}
      >
        {children}
      </Tooltip>

  );
};

export default TooltipWrapper;
