import clsx from "clsx";

import { forwardRef, ReactNode } from "react";

import { DynamicTooltipWrapper } from "./TooltipWrapper";
import { USWDSIcon } from "./USWDSIcon";

export interface InfoTooltipProps {
  text: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
  wrapperClasses?: string;
  title?: string;
}

const InfoTooltip = ({
  text,
  position = "top",
  className,
  wrapperClasses,
  title,
}: InfoTooltipProps) => {
  const IconWrapper = forwardRef<
    HTMLSpanElement,
    React.HTMLProps<HTMLSpanElement>
  >((props, ref) => (
    <span
      {...props}
      ref={ref}
      style={{ cursor: "help" }}
      className={clsx("text-secondary", props.className)}
    >
      <USWDSIcon name="info_outline" />
    </span>
  ));

  IconWrapper.displayName = "IconWrapper";

  return (
    <DynamicTooltipWrapper
      title={title}
      label={text}
      position={position}
      asCustom={IconWrapper}
      className={className}
      wrapperclasses={wrapperClasses}
      data-testid="tooltipWrapper"
    >
      <></>
    </DynamicTooltipWrapper>
  );
};

InfoTooltip.displayName = "InfoTooltip";

export default InfoTooltip;
