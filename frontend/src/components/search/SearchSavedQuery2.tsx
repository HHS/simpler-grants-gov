"use client";

import { forwardRef, JSX } from "react";
import { Tooltip } from "@trussworks/react-uswds";

type CustomLinkProps = React.PropsWithChildren<{
  to: string;
  className?: string;
}> &
  JSX.IntrinsicElements["a"] &
  React.RefAttributes<HTMLAnchorElement>;

const CustomLinkForwardRef: React.ForwardRefRenderFunction<
  HTMLAnchorElement,
  CustomLinkProps
> = ({ to, className, children, ...tooltipProps }: CustomLinkProps, ref) => (
  <a ref={ref} href={to} className={className} {...tooltipProps}>
    {children}
  </a>
);

const CustomLink = forwardRef(CustomLinkForwardRef);

const SearchSavedQuery2 = () => {
  return (
    <div className="border-base-lighter border-1px">
      <div className="margin-4">
        <p>
          <Tooltip<CustomLinkProps>
            label="Follow Link"
            asCustom={CustomLink}
            to="http://www.truss.works"
          >
            This
          </Tooltip>
          &nbsp;is a custom component link.
        </p>
      </div>
      ;
    </div>
  );
};

export default SearchSavedQuery2;
