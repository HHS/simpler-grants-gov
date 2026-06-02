"use client";

import SessionStorage from "src/services/sessionStorage/sessionStorage";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { ModalRef } from "@trussworks/react-uswds";

import { LoginLink } from "src/components/core/LoginButton";
import { SimplerModal } from "src/components/core/SimplerModal";

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
      modalId={"piv-required-modal"}
      modalRef={pivModalRef}
      onClose={() => {
        SessionStorage.removeItem("showPivError");
      }}
      titleText={t("title")}
      className="text-wrap"
    >
      <p>{t("description")}</p>
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
