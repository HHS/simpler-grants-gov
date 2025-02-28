"use client";

import { useTranslations } from "next-intl";
import { useRef } from "react";
import {
  Button,
  Modal,
  ModalFooter,
  ModalHeading,
  ModalRef,
  ModalToggleButton,
} from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/USWDSIcon";

export function SaveSearchModal() {
  const t = useTranslations("Search.saveSearch.modal");
  const modalId = "save-search";
  const modalRef = useRef<ModalRef>(null);
  return (
    <>
      <div className="usa-nav__primary margin-top-0 padding-top-2px text-no-wrap desktop:order-last margin-left-auto">
        <div className="usa-nav__primary-item border-0">
          <ModalToggleButton
            modalRef={modalRef}
            opener
            className="usa-nav__link font-sans-2xs display-flex text-normal border-0"
            data-testid="sign-in-button"
          >
            <USWDSIcon
              className="usa-icon margin-right-05 margin-left-neg-05"
              name="add_circle_outline"
              key="save-search"
            />
            {t("saveText")}
          </ModalToggleButton>
        </div>
      </div>
      <Modal
        ref={modalRef}
        forceAction
        className="text-wrap"
        aria-labelledby={`${modalId}-heading`}
        aria-describedby={`${modalId}-description`}
        id={modalId}
      >
        <ModalHeading id={`${modalId}-heading`}>{t("title")}</ModalHeading>
        <div className="usa-prose">
          <p className="font-sans-2xs margin-y-4">{t("description")}</p>
        </div>
        <ModalFooter>
          <Button type={"button"}>{t("saveText")}</Button>
          <ModalToggleButton
            modalRef={modalRef}
            closer
            unstyled
            className="padding-105 text-center"
          >
            {t("cancelText")}
          </ModalToggleButton>
        </ModalFooter>
      </Modal>
    </>
  );
}
