import { useTranslations } from "next-intl";
import { RefObject } from "react";
import { ModalRef, ModalToggleButton } from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/USWDSIcon";

export const DrawerControl = ({
  drawerRef,
}: {
  drawerRef: RefObject<ModalRef | null>;
}) => {
  const t = useTranslations("HeaderLoginModal");
  return (
    <>
      <div className="usa-nav__primary margin-top-0 padding-top-2px text-no-wrap desktop:order-last margin-left-auto">
        <div className="usa-nav__primary-item border-0">
          <ModalToggleButton
            modalRef={drawerRef}
            opener
            className="usa-nav__link font-sans-2xs display-flex text-normal border-0"
            data-testid="sign-in-button"
          >
            <USWDSIcon
              className="usa-icon margin-right-05 margin-left-neg-05"
              name="login"
              key="login-link-icon"
            />
            open drawer
          </ModalToggleButton>
        </div>
      </div>
    </>
  );
};
