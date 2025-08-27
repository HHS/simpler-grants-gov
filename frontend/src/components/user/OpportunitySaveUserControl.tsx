"use client";

import { useClientFetch } from "src/hooks/useClientFetch";
import { useFeatureFlags } from "src/hooks/useFeatureFlags";
import { useUser } from "src/services/auth/useUser";
import { MinimalOpportunity } from "src/types/opportunity/opportunityResponseTypes";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ModalRef, ModalToggleButton } from "@trussworks/react-uswds";

import { LoginModal } from "src/components/LoginModal";
import SaveButton from "src/components/SaveButton";
import SaveIcon from "src/components/SaveIcon";
import { USWDSIcon } from "src/components/USWDSIcon";

const SAVED_OPPS_PAGE_LINK = "/saved-opportunities";

export const OpportunitySaveUserControl = ({
  opportunityId,
  type = "button",
  opportunitySaved,
}: {
  opportunityId: string;
  type?: "button" | "icon";
  opportunitySaved: boolean;
}) => {
  const t = useTranslations("OpportunityListing");
  const modalRef = useRef<ModalRef>(null);

  const { clientFetch: updateSaved } = useClientFetch<{ type: string }>(
    "Error updating saved opportunity",
  );

  const { user } = useUser();
  const [locallySaved, setLocallySaved] = useState<boolean | null>(null);
  const [showMessage, setshowMessage] = useState(false);
  const [savedError, setSavedError] = useState(false);
  const [loading, setLoading] = useState(false);

  const displayAsSaved = useMemo(
    () => (locallySaved === null ? opportunitySaved : locallySaved),
    [locallySaved, opportunitySaved],
  );

  const closeMessage = () => {
    setshowMessage(false);
  };

  const userSavedOppCallback = async () => {
    setLoading(true);

    const method = displayAsSaved ? "DELETE" : "POST";
    try {
      const data = await updateSaved("/api/user/saved-opportunities", {
        method,
        body: JSON.stringify({ opportunityId }),
      });
      setLocallySaved(data.type === "save");
    } catch (e) {
      setSavedError(true);
      console.error(e);
    } finally {
      setshowMessage(true);
      setLoading(false);
    }
  };

  const messageText = displayAsSaved
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

  if (type === "icon") {
    return (
      <>
        {user?.token ? (
          <SaveIcon
            onClick={() => {
              userSavedOppCallback().catch(console.error);
            }}
            loading={loading}
            saved={displayAsSaved}
          />
        ) : (
          <>
            <ModalToggleButton
              id={`save-search-result-${opportunityId}`}
              modalRef={modalRef}
              opener
              className="usa-button--unstyled"
            >
              <SaveIcon saved={false} />
            </ModalToggleButton>
            <LoginModal
              modalRef={modalRef as React.RefObject<ModalRef>}
              helpText={t("saveloginModal.help")}
              buttonText={t("saveloginModal.button")}
              closeText={t("saveloginModal.close")}
              descriptionText={t("saveloginModal.description")}
              titleText={t("saveloginModal.title")}
              modalId={`opp-save-login-modal-${opportunityId}`}
            />
          </>
        )}
      </>
    );
  }

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
          saved={displayAsSaved}
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
            modalId={`opp-save-login-modal-${opportunityId}`}
          />
        </>
      )}
    </>
  );
};
