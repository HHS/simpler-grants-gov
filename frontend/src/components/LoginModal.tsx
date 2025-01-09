import { useTranslations } from "next-intl";
import { useRef } from "react";
import {
  ButtonGroup,
  Modal,
  ModalFooter,
  ModalHeading,
  ModalRef,
  ModalToggleButton,
} from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/USWDSIcon";

const LOGIN_URL = "/api/auth/login";

export const LoginModal = () => {
  const t = useTranslations("LoginModal");
  const modalRef = useRef<ModalRef>(null);

  return (
    <>
      <div className="usa-nav__primary margin-top-0 margin-bottom-1 desktop:margin-bottom-5px text-no-wrap desktop:order-last margin-left-auto">
        <div className="usa-nav__primary-item border-0">
          <ModalToggleButton
            modalRef={modalRef}
            opener
            className="usa-nav__link text-ysaprimary font-sans-2xs display-flex text-normal"
          >
            <USWDSIcon
              className="usa-icon margin-right-05 margin-left-neg-05"
              name="login"
              key="login-link-icon"
            />
            {t("link")}
          </ModalToggleButton>
        </div>
      </div>
      <Modal
        ref={modalRef}
        forceAction
        aria-labelledby="login-modal-heading"
        aria-describedby="login-modal-description"
        id="login-modal"
      >
        <ModalHeading id="login-modal-heading">{t("title")}</ModalHeading>
        <div className="usa-prose">
          <p>{t("help")}</p>
          <p className="font-sans-3xs margin-y-5">{t("description")}</p>
        </div>
        <ModalFooter>
          <ButtonGroup>
            <a href={LOGIN_URL} key="login-link" className="usa-button">
              {t("button")}
              <USWDSIcon
                className="usa-icon margin-right-05 margin-left-neg-05"
                name="launch"
                key="login-gov-link-icon"
              />
            </a>
            <ModalToggleButton
              modalRef={modalRef}
              closer
              unstyled
              className="padding-105 text-center"
            >
              {t("close")}
            </ModalToggleButton>
          </ButtonGroup>
        </ModalFooter>
      </Modal>
    </>
  );
};
