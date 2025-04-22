import { ReactNode, forwardRef } from "react";

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
  const IconWrapper = forwardRef<HTMLSpanElement, React.HTMLProps<HTMLSpanElement>>((props, ref) => (
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
  
  IconWrapper.displayName = 'IconWrapper';

  return (
    <TooltipWrapper
      label={text}
      position={position}
      asCustom={IconWrapper}
      className={className}
      data-testid="tooltipWrapper"
    />
  );
};

InfoTooltip.displayName = 'InfoTooltip';

export default InfoTooltip;
