import { ReactNode, forwardRef } from "react";

import { UswdsIconNames } from "src/types/generalTypes";
import { TooltipWrapper } from "./TooltipWrapper";
import { USWDSIcon } from "./USWDSIcon";

export interface InfoTooltipProps {
  text: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

const InfoTooltip = ({
  text,
  position = "top",
  className,
}: InfoTooltipProps) => {
  const IconWrapper = forwardRef<HTMLSpanElement, any>((props, ref) => (
  <span 
    {...props}
    ref={ref}
    style={{ cursor: 'help' }}
    className="text-secondary"
  >
    <USWDSIcon
      name="info_outline"
    />
  </span>
));


  return (
    <TooltipWrapper
      label={text}
      position={position}
      asCustom={IconWrapper}
      className={className}
    >
      <span />
    </TooltipWrapper>
  );
};

export default InfoTooltip;
