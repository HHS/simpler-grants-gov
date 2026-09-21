"use client";

import SessionStorage from "src/services/sessionStorage/sessionStorage";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { ModalRef } from "@trussworks/react-uswds";

import { LoginLink } from "src/components/core/LoginButton";
import { SimplerModal } from "src/components/core/SimplerModal";

const MODAL_ID = "piv-required-modal";
const DESCRIPTION_ID = `${MODAL_ID}-description`;

export const PivRequiredModal = () => {
  const t = useTranslations("PivRequiredModal");
  const pivModalRef = useRef<ModalRef | null>(null);
  useEffect(() => {
    const pivError = SessionStorage.getItem("showPivError") === "true";
    if (pivError && pivModalRef?.current) {
      pivModalRef.current?.toggleModal();
    }
  }, []);
  return (
    <SimplerModal
      modalId={MODAL_ID}
      modalRef={pivModalRef}
      onClose={() => {
        SessionStorage.removeItem("showPivError");
      }}
      titleText={t("title")}
      descriptionId={DESCRIPTION_ID}
      className="text-wrap"
    >
      <p id={DESCRIPTION_ID}>{t("description")}</p>
      <div className="margin-top-3">
        <LoginLink
          className="usa-button"
          queryParameters={{ piv_required: "true" }}
        >
          {t("button")}
        </LoginLink>
      </div>
    </SimplerModal>
  );
};
