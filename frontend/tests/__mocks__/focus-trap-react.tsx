import type * as FocusTrapType from "focus-trap-react";

import { ComponentType } from "react";

const FocusTrap =
  jest.requireActual<ComponentType<FocusTrapType.Props>>("focus-trap-react");

/**
 * Override displayCheck for testing. See: https://github.com/focus-trap/tabbable#testing-in-jsdom
 */
const FixedComponent = ({
  focusTrapOptions,
  ...props
}: FocusTrapType.Props) => {
  const fixedOptions = { ...focusTrapOptions };
  fixedOptions.tabbableOptions = {
    ...fixedOptions.tabbableOptions,
    displayCheck: "none",
  };
  return <FocusTrap {...props} focusTrapOptions={fixedOptions} />;
};

module.exports = FixedComponent;
