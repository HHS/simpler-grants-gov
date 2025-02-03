"use client";

import { useUser } from "src/services/auth/useUser";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Alert, ModalRef, ModalToggleButton } from "@trussworks/react-uswds";

import { LoginModal } from "src/components/LoginModal";
import SaveButton from "src/components/SaveButton";
import { USWDSIcon } from "src/components/USWDSIcon";

export const OpportunitySaveUserControl = () => {
  const t = useTranslations("OpportunityListing");
  const modalRef = useRef<ModalRef>(null);
  const params = useParams();
  const opportunity_id = String(params.id);

  const { user } = useUser();
  const [saved, setSaved] = useState(false);
  const [savedAlert, setSavedAlert] = useState(false);
  const [savedError, setSavedError] = useState(false);

  const [loading, setloading] = useState(false);

  const userSavedOppCallback = async () => {
    setSavedError(false);
    const method = saved ? "DELETE" : "POST";
    setloading(true);
    const res = await fetch("/api/user/saved-opportunities", {
      method,
      headers: {
        saved: "true",
        opportunity_id,
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const data = await res.json();
    // if error

    setloading(false);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    data.type === "save" ? setSaved(true) : setSaved(false);
    saved ?? setSavedAlert(true);
  };

  useEffect(() => {
    fetch(`/api/user/saved-opportunities/${opportunity_id}`)
      .then((response) => response.json())
      .then((data) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        data.length ?? setSaved(true);
      })
      .catch(() => {
        setSaved(false);
      });
  }, [opportunity_id]);

  return (
    <>
      {!user?.token && (
        <>
          <ModalToggleButton
            modalRef={modalRef}
            opener
            className="simpler-save-button usa-button usa-button--outline"
          >
            <USWDSIcon name="star_outline" />
            {t("save_button.save")}
          </ModalToggleButton>
          <LoginModal
            modalRef={modalRef as React.RefObject<ModalRef>}
            helpText={t("save_login_modal.help")}
            buttonText={t("save_login_modal.button")}
            closeText={t("save_login_modal.close")}
            descriptionText={t("save_login_modal.description")}
            titleText={t("save_login_modal.title")}
            modalId="opp-save-login-modal"
          />
        </>
      )}
      {!!user?.token && (
        <SaveButton
          defaultText={t("save_button.save")}
          savedText={t("save_button.saved")}
          loadingText={t("save_button.loading")}
          saved={saved}
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onClick={userSavedOppCallback}
          loading={loading}
        />
      )}
      {savedAlert && (
        <Alert
          slim={true}
          type="success"
          heading={t("save_message.success")}
          headingLevel="h4"
        />
      )}
      {savedError && (
        <Alert
          slim={true}
          type="success"
          heading={t("save_message.error_save")}
          headingLevel="h4"
        />
      )}
    </>
  );
};
