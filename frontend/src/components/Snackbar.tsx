import clsx from "clsx";

import { ReactNode } from "react";
import { Button } from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/USWDSIcon";

type SnackbarProps = {
  children: ReactNode;
  close: () => void;
  isVisible: boolean;
};

const Snackbar = ({ children, close, isVisible = false }: SnackbarProps) => {
  return (
    <div
      aria-hidden={!isVisible}
      role="status"
      data-testid="snackbar"
      className={clsx(
        "bg-base-darkest display-flex flex-align-start font-sans-2xs position-fixed padding-2 radius-md right-0 text-left text-white top-0 usa-modal-wrapper",
        {
          "is-hidden": !isVisible,
          "is-visible": isVisible,
        },
      )}
    >
      {children}
      <Button
        data-testid="snackbar-close"
        aria-label="close"
        type="button"
        className="padding-left-2 text-white"
        onClick={close}
        unstyled
      >
        <USWDSIcon name="close"></USWDSIcon>
      </Button>
    </div>
  );
};

export default Snackbar;
