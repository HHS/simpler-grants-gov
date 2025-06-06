"use client";

import { useClientFetch } from "src/hooks/useClientFetch";
import { useFeatureFlags } from "src/hooks/useFeatureFlags";
import { useUser } from "src/services/auth/useUser";
import { MinimalOpportunity } from "src/types/opportunity/opportunityResponseTypes";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ModalRef, ModalToggleButton } from "@trussworks/react-uswds";

import { LoginModal } from "src/components/LoginModal";
import SaveButton from "src/components/SaveButton";
import { USWDSIcon } from "src/components/USWDSIcon";

const SAVED_OPPS_PAGE_LINK = "/saved-opportunities";

export const OpportunitySaveUserControl = () => {
  const t = useTranslations("OpportunityListing");
  const modalRef = useRef<ModalRef>(null);
  const params = useParams();
  const opportunityId = String(params.id);
  const { clientFetch: fetchSaved } = useClientFetch<MinimalOpportunity[]>(
    "Error fetching saved opportunity",
  );

  const { clientFetch: updateSaved } = useClientFetch<{ type: string }>(
    "Error updating saved opportunity",
  );

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
      const data = await updateSaved("/api/user/saved-opportunities", {
        method,
        body: JSON.stringify({ opportunityId }),
      });
      setSaved(data.type === "save");
    } catch (e) {
      setSavedError(true);
      console.error(e);
    } finally {
      setshowMessage(true);
      setLoading(false);
    }
  };

  // fetch user's saved opportunities
  useEffect(() => {
    if (!user?.token) return;
    setLoading(true);
    fetchSaved(`/api/user/saved-opportunities/${opportunityId}`)
      .then((data) => {
        data && setSaved(true);
      })
      .catch((e) => {
        console.error(e);
      })
      .finally(() => {
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opportunityId, user?.token]);

  const messageText = saved
    ? savedError
      ? t("saveMessage.errorUnsave")
      : t.rich("saveMessage.save", {
          linkSavedOpportunities: (chunks) => (
            <Link className="text-black" href={SAVED_OPPS_PAGE_LINK}>
              {chunks}
            </Link>
          ),
        })
    : savedError
      ? t("saveMessage.errorSave")
      : t("saveMessage.unsave");

  const { checkFeatureFlag } = useFeatureFlags();
  if (!checkFeatureFlag("savedOpportunitiesOn")) return null;
  return (
    <>
      {user?.token ? (
        <SaveButton
          buttonClick={userSavedOppCallback}
          messageClick={closeMessage}
          buttonId="opp-save-button"
          defaultText={t("saveButton.save")}
          error={savedError}
          messageText={messageText}
          message={showMessage}
          loading={loading}
          loadingText={t("saveButton.loading")}
          saved={saved}
          savedText={t("saveButton.saved")}
        />
      ) : (
        <>
          <ModalToggleButton
            modalRef={modalRef}
            opener
            className="usa-button usa-button--outline"
          >
            <USWDSIcon name="star_outline" className="button-icon-large" />
            {t("saveButton.save")}
          </ModalToggleButton>
          <LoginModal
            modalRef={modalRef as React.RefObject<ModalRef>}
            helpText={t("saveloginModal.help")}
            buttonText={t("saveloginModal.button")}
            closeText={t("saveloginModal.close")}
            descriptionText={t("saveloginModal.description")}
            titleText={t("saveloginModal.title")}
            modalId="opp-save-login-modal"
          />
        </>
      )}
    </>
  );
};
