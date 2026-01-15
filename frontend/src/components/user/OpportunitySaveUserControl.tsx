"use client";

import { useClientFetch } from "src/hooks/useClientFetch";
import { useIsSSR } from "src/hooks/useIsSSR";
import { useLoginModal } from "src/services/auth/LoginModalProvider";
import { useUser } from "src/services/auth/useUser";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ModalToggleButton } from "@trussworks/react-uswds";

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

  const {
    loginModalRef,
    setButtonText,
    setCloseText,
    setDescriptionText,
    setHelpText,
    setTitleText,
  } = useLoginModal();

  // Next will try to render this server side without a ref for the login modal,
  // which causes a hydration error. To work around this, we'll render a dummy button server side
  // instead
  const isSSR = useIsSSR();

  const { clientFetch: updateSaved } = useClientFetch<{ type: string }>(
    "Error updating saved opportunity",
  );

  const { user } = useUser();
  const [locallySaved, setLocallySaved] = useState<boolean | null>(null);
  const [showMessage, setshowMessage] = useState(false);
  const [savedError, setSavedError] = useState(false);
  const [loading, setLoading] = useState(false);

  const displayAsSaved = useMemo(() => {
    return locallySaved === null ? opportunitySaved : locallySaved;
  }, [locallySaved, opportunitySaved]);

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
        ) : isSSR ? (
          <SaveIcon saved={false} />
        ) : (
          <ModalToggleButton
            id={`save-search-result-${opportunityId}`}
            modalRef={loginModalRef}
            opener
            className="usa-button--unstyled"
            onClick={() => {
              setHelpText(t("saveloginModal.help"));
              setButtonText(t("saveloginModal.button"));
              setCloseText(t("saveloginModal.close"));
              setDescriptionText(t("saveloginModal.description"));
              setTitleText(t("saveloginModal.title"));
            }}
          >
            <SaveIcon saved={false} />
          </ModalToggleButton>
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
      ) : isSSR ? (
        <SaveIcon saved={false} />
      ) : (
        <ModalToggleButton
          modalRef={loginModalRef}
          opener
          className="usa-button usa-button--outline"
          onClick={() => {
            setHelpText(t("saveloginModal.help"));
            setButtonText(t("saveloginModal.button"));
            setCloseText(t("saveloginModal.close"));
            setDescriptionText(t("saveloginModal.description"));
            setTitleText(t("saveloginModal.title"));
          }}
        >
          <USWDSIcon name="star_outline" className="button-icon-large" />
          {t("saveButton.save")}
        </ModalToggleButton>
      )}
    </>
  );
};
