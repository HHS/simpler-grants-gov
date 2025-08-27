import clsx from "clsx";
import { UswdsIconNames } from "src/types/generalTypes";

import { RefObject } from "react";
import { ModalRef, ModalToggleButton } from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/USWDSIcon";

export const DrawerControl = ({
  drawerRef,
  buttonText,
  iconName,
  className,
}: {
  drawerRef: RefObject<ModalRef | null>;
  buttonText: string;
  iconName?: UswdsIconNames;
  className?: string;
}) => {
  return (
    <ModalToggleButton
      modalRef={drawerRef}
      opener
      outline
      className={clsx("display-block", className)}
      data-testid="toggle-drawer"
    >
      {iconName && (
        <USWDSIcon
          className="usa-icon margin-right-05 margin-left-neg-05"
          name={iconName}
        />
      )}
      {buttonText}
    </ModalToggleButton>
  );
};
