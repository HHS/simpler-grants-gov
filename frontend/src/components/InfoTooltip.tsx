import clsx from "clsx";

import dynamic from "next/dynamic";
import { forwardRef, ReactNode } from "react";

import { USWDSIcon } from "./USWDSIcon";

export interface InfoTooltipProps {
  text: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
  wrapperClasses?: string;
  title?: string;
}

const DynamicTooltipWrapper = dynamic(
  () => import("src/components/TooltipWrapper"),
  {
    ssr: false, // works around bug with Trussworks assigning different random ids on server and client renders
  },
);

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
