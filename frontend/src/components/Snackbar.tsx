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
        "bg-base-darkest display-flex flex-justify flex-align-start font-sans-2xs text-left text-white width-full usa-modal-wrapper radius-md position-fixed padding-2 right-0 bottom-0 tablet:maxw-mobile-lg tablet:margin-bottom-2 tablet:right-2 z-100",
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
