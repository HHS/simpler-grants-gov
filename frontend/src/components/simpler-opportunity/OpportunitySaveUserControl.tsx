"use client";

import { useIsSSR } from "src/hooks/useIsSSR";
import { useOpportunitySave } from "src/hooks/useOpportunitySave";
import { useLoginModal } from "src/services/auth/LoginModalProvider";
import { useUser } from "src/services/auth/useUser";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { ReactNode } from "react";
import { ModalToggleButton } from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/core/USWDSIcon";
import SaveButton from "src/components/saved-opportunities/SaveButton";
import SaveIcon from "src/components/saved-opportunities/SaveIcon";

export const SAVED_OPPS_PAGE_LINK = "/workspace/saved-opportunities";

// Opens the login modal for signed out users who try to save an opportunity
export const OpportunitySaveLoginButton = ({
  children,
}: {
  children?: ReactNode;
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

  return (
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
      {children}
    </ModalToggleButton>
  );
};

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

  const { user } = useUser();
  const {
    closeMessage,
    displayAsSaved,
    loading,
    savedError,
    showMessage,
    toggleSaved,
  } = useOpportunitySave({ opportunityId, opportunitySaved });

  const messageText = displayAsSaved
    ? savedError
      ? t("saveMessage.errorUnsave")
      : t.rich("saveMessage.save", {
          linkSavedOpportunities: (chunks) => (
            <Link className="text-black" href={SAVED_OPPS_PAGE_LINK}>
              {chunks}
            </Link>
          ),
          srOnly: (chunks) => <span className="usa-sr-only">{chunks}</span>,
        })
    : savedError
      ? t("saveMessage.errorSave")
      : t("saveMessage.unsave");

  if (type === "icon") {
    return (
      <>
        {user?.token ? (
          <SaveIcon
            onClick={toggleSaved}
            loading={loading}
            saved={displayAsSaved}
          />
        ) : isSSR ? (
          <button
            type="button"
            className="usa-button--unstyled"
            aria-label="Save opportunity"
          >
            <SaveIcon saved={false} />
          </button>
        ) : (
          <ModalToggleButton
            id={`save-search-result-${opportunityId}`}
            modalRef={loginModalRef}
            opener
            className="usa-button--unstyled"
            aria-label="Save opportunity"
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
          buttonClick={toggleSaved}
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
        <OpportunitySaveLoginButton />
      )}
    </>
  );
};
