// see https://github.com/trussworks/react-uswds/blob/main/src/components/modal/ModalWrapper/ModalWrapper.tsx

import clsx from "clsx";

import React, { forwardRef, type JSX } from "react";

interface ModalWrapperProps {
  id: string;
  children: React.ReactNode;
  isVisible: boolean;
  forceAction: boolean;
  handleClose: () => void;
  className?: string;
}

export const ModalWrapperForwardRef: React.ForwardRefRenderFunction<
  HTMLDivElement,
  ModalWrapperProps & JSX.IntrinsicElements["div"]
> = (
  { id, children, isVisible, forceAction, className, handleClose, ...divProps },
  ref,
): JSX.Element => {
  const classes = clsx(
    "usa-modal-wrapper",
    {
      "is-visible": isVisible,
      "is-hidden": !isVisible,
    },
    className,
  );

  /* eslint-disable jsx-a11y/click-events-have-key-events */

  return (
    <div {...divProps} ref={ref} id={id} className={classes} role="dialog">
      <div
        data-testid="modalOverlay"
        className="usa-modal-overlay"
        onClick={forceAction ? undefined : handleClose}
        aria-controls={id}
      >
        {children}
      </div>
    </div>
  );
};

export const ModalWrapper = forwardRef(ModalWrapperForwardRef);

export default ModalWrapper;
