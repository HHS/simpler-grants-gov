import { FocusTrapProps } from "focus-trap-react";

import { ComponentType } from "react";

const ActualFocusTrap =
  jest.requireActual<ComponentType<FocusTrapProps>>("focus-trap-react");

/**
 * Override displayCheck for testing. See: https://github.com/focus-trap/tabbable#testing-in-jsdom
 */
export const FocusTrap = ({ focusTrapOptions, ...props }: FocusTrapProps) => {
  const fixedOptions = { ...focusTrapOptions };
  fixedOptions.tabbableOptions = {
    ...fixedOptions.tabbableOptions,
    displayCheck: "none",
  };
  return <ActualFocusTrap {...props} focusTrapOptions={fixedOptions} />;
};
