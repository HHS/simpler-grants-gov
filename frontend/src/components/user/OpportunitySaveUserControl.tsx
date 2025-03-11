"use client";

import { useFeatureFlags } from "src/hooks/useFeatureFlags";
import { useUser } from "src/services/auth/useUser";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ModalRef, ModalToggleButton } from "@trussworks/react-uswds";

import { LoginModal } from "src/components/LoginModal";
import SaveButton from "src/components/SaveButton";
import { USWDSIcon } from "src/components/USWDSIcon";

const SAVED_OPPS_PAGE_LINK = "/saved-grants";

export const OpportunitySaveUserControl = () => {
  const t = useTranslations("OpportunityListing");
  const modalRef = useRef<ModalRef>(null);
  const params = useParams();
  const opportunityId = String(params.id);

  const { user } = useUser();
  const [saved, setSaved] = useState(false);
  const [showMessage, setshowMessage] = useState(false);
  const [savedError, setSavedError] = useState(false);
  const [loading, setLoading] = useState(false);

  const closeMessage = () => {
    setshowMessage(false);
  };

  const userSavedOppCallback = async () => {
    setLoading(true);

    const method = saved ? "DELETE" : "POST";
    try {
      const res = await fetch("/api/user/saved-opportunities", {
        method,
        body: JSON.stringify({ opportunityId }),
      });
      if (res.ok && res.status === 200) {
        const data = (await res.json()) as { type: string };
        data.type === "save" ? setSaved(true) : setSaved(false);
      } else {
        setSavedError(true);
      }
    } catch (error) {
      setSavedError(true);
      console.error(error);
    } finally {
      setshowMessage(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.token) return;
    setLoading(true);
    fetch(`/api/user/saved-opportunities/${opportunityId}`)
      .then((res) => (res.ok && res.status === 200 ? res.json() : null))
      .then((data) => {
        data && setSaved(true);
      })
      .finally(() => {
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
      });
  }, [opportunityId, user]);

  const messageText = saved
    ? savedError
      ? t("save_message.error_unsave")
      : t.rich("save_message.save", {
          linkSavedGrants: (chunks) => (
            <Link className="text-black" href={SAVED_OPPS_PAGE_LINK}>
              {chunks}
            </Link>
          ),
        })
    : savedError
      ? t("save_message.error_save")
      : t("save_message.unsave");

  const { checkFeatureFlag } = useFeatureFlags();
  if (!checkFeatureFlag("savedOpportunitiesOn")) return null;
  return (
    <>
      {user?.token ? (
        <SaveButton
          buttonClick={userSavedOppCallback}
          messageClick={closeMessage}
          buttonId="opp-save-button"
          defaultText={t("save_button.save")}
          error={savedError}
          messageText={messageText}
          message={showMessage}
          loading={loading}
          loadingText={t("save_button.loading")}
          saved={saved}
          savedText={t("save_button.saved")}
        />
      ) : (
        <>
          <ModalToggleButton
            modalRef={modalRef}
            opener
            className="usa-button usa-button--outline"
          >
            <USWDSIcon name="star_outline" className="button-icon-large" />
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
    </>
  );
};
