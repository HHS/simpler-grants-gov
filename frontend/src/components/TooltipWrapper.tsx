import dynamic from "next/dynamic";
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

export const DynamicTooltipWrapper = dynamic(
  () => import("src/components/TooltipWrapper"),
  {
    ssr: false, // works around bug with Trussworks assigning different random ids on server and client renders
  },
);

export default TooltipWrapper;
