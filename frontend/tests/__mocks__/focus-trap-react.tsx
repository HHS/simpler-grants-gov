// import type * as FocusTrapType from "focus-trap-react";

// import { ComponentType } from "react";

// const FocusTrap =
//   jest.requireActual<ComponentType<FocusTrapType.FocusTrap>>(
//     "focus-trap-react",
//   );

// /**
//  * Override displayCheck for testing. See: https://github.com/focus-trap/tabbable#testing-in-jsdom
//  */
// const FixedComponent = ({
//   focusTrapOptions,
//   ...props
// }: FocusTrapType.FocusTrapProps) => {
//   const fixedOptions = { ...focusTrapOptions };
//   fixedOptions.tabbableOptions = {
//     ...fixedOptions.tabbableOptions,
//     displayCheck: "none",
//   };
//   return <FocusTrap {...props} focusTrapOptions={fixedOptions} />;
// };

// module.exports = FixedComponent;

// from https://github.com/trussworks/react-uswds/blob/main/__mocks__/focus-trap-react.tsx

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
