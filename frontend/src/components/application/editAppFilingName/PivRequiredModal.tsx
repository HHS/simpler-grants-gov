"use client";

import SessionStorage from "src/services/sessionStorage/sessionStorage";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { ModalRef } from "@trussworks/react-uswds";

import { LoginLink } from "src/components/LoginButton";
import { SimplerModal } from "src/components/SimplerModal";

export const PivRequiredModal = () => {
  const [showPivError, setShowPivError] = useState<string | null>("false");
  const t = useTranslations("PivRequiredModal");
  const pivModalRef = useRef<ModalRef | null>(null);
  useEffect(() => {
    setShowPivError(SessionStorage.getItem("showPivError"));
  }, []);
  if (showPivError === "true") {
    SessionStorage.removeItem("showPivError");
    return (
      <SimplerModal
        modalId={"piv-required-modal"}
        modalRef={pivModalRef}
        isInitiallyOpen={true}
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
            queryParameters={{ require_piv: "true" }}
          >
            {t("button")}
          </LoginLink>
        </div>
      </SimplerModal>
    );
  }
  return <></>;
};
