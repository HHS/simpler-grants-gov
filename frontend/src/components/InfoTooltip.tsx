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
  const IconWrapper = forwardRef<HTMLSpanElement>((props, ref) => (
    <span 
      {...props} 
      ref={ref}
      style={{ 
        display: 'inline-flex',
        cursor: 'help',
        verticalAlign: 'middle'
      }}
    >
      <USWDSIcon
        name="info_outline"
        height="16px"
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
    />
  );
};

export default InfoTooltip;
