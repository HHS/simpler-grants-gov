import clsx from "clsx";

import { ReactNode } from "react";

type SnackbarProps = {
  children: ReactNode;
  isVisible: boolean;
};

const Snackbar = ({ children, isVisible = false }: SnackbarProps) => {
  return (
    <div
      data-testid="snackbar"
      className={clsx(
        "bg-base-darkest font-sans-2xs position-fixed padding-2 radius-md right-0 text-left text-white top-0 usa-modal-wrapper",
        {
          "is-hidden": !isVisible,
          "is-visible": isVisible,
        },
      )}
    >
      {children}
    </div>
  );
};

export default Snackbar;
