import { UswdsIconNames } from "src/types/generalTypes";

import { useTranslations } from "next-intl";
import { RefObject } from "react";
import { ModalRef, ModalToggleButton } from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/USWDSIcon";

export const DrawerControl = ({
  drawerRef,
  buttonText,
  iconName,
}: {
  drawerRef: RefObject<ModalRef | null>;
  buttonText: string;
  iconName?: UswdsIconNames;
}) => {
  const t = useTranslations("Search");
  return (
    <ModalToggleButton
      modalRef={drawerRef}
      opener
      secondary
      className="display-block margin-x-auto"
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
