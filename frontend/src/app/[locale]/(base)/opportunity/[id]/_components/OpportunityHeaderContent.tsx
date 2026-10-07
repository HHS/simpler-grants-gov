"use client";

import { useIsSSR } from "src/hooks/useIsSSR";
import { useOpportunitySave } from "src/hooks/useOpportunitySave";
import { useUser } from "src/services/auth/useUser";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { ReactNode } from "react";
import { Alert, Button } from "@trussworks/react-uswds";

import SimplerAlert from "src/components/core/SimplerAlert";
import { USWDSIcon } from "src/components/core/USWDSIcon";
import SaveButton from "src/components/saved-opportunities/SaveButton";
import {
  OpportunitySaveLoginButton,
  SAVED_OPPS_PAGE_LINK,
} from "src/components/simpler-opportunity/OpportunitySaveUserControl";

const SAVE_BUTTON_ID = "opp-save-button";

type OpportunityHeaderContentProps = {
  applyAction: ReactNode;
  details: ReactNode;
  opportunityId: string;
  opportunitySaved: boolean;
  opportunityTitle: string | null;
};

/*
  Client side portion of the opportunity header. Save state lives here because a failed
  save / unsave is reported above the title, while the success message follows the call to
  action buttons in both reading and tab order.
*/
export const OpportunityHeaderContent = ({
  applyAction,
  details,
  opportunityId,
  opportunitySaved,
  opportunityTitle,
}: OpportunityHeaderContentProps) => {
  const t = useTranslations("OpportunityListing");
  const { user } = useUser();
  // the login modal ref isn't available during server rendering, see OpportunitySaveUserControl
  const isSSR = useIsSSR();

  const {
    closeMessage,
    displayAsSaved,
    loading,
    savedError,
    showMessage,
    toggleSaved,
  } = useOpportunitySave({ opportunityId, opportunitySaved });

  const accessibleContext = t("saveButton.accessibleContext", {
    title: opportunityTitle || "",
  });

  // a failed request leaves the saved state unchanged, so the saved state tells us what failed
  const errorText = displayAsSaved
    ? t("saveMessage.errorUnsave")
    : t("saveMessage.errorSave");

  const successText = displayAsSaved
    ? t.rich("saveMessage.save", {
        linkSavedOpportunities: (chunks) => (
          <Link className="text-black" href={SAVED_OPPS_PAGE_LINK}>
            {chunks}
          </Link>
        ),
        srOnly: (chunks) => <span className="usa-sr-only">{chunks}</span>,
      })
    : t("saveMessage.unsave");

  // the dismiss button is removed along with the message, so return focus to the save button
  const dismissSuccessMessage = () => {
    closeMessage();
    document.getElementById(SAVE_BUTTON_ID)?.focus();
  };

  const saveControl = user?.token ? (
    <SaveButton
      accessibleContext={accessibleContext}
      buttonClick={toggleSaved}
      messageClick={closeMessage}
      buttonId={SAVE_BUTTON_ID}
      defaultText={t("saveButton.save")}
      error={savedError}
      // messages are rendered by the header rather than next to the button
      message={false}
      messageText=""
      loading={loading}
      loadingText={t("saveButton.loading")}
      saved={displayAsSaved}
      savedText={t("saveButton.saved")}
    />
  ) : isSSR ? (
    <Button type="button" outline>
      <USWDSIcon name="star_outline" className="button-icon-large" />
      {t("saveButton.save")}
    </Button>
  ) : (
    <OpportunitySaveLoginButton>
      {" "}
      <span className="usa-sr-only">{accessibleContext}</span>
    </OpportunitySaveLoginButton>
  );

  return (
    <>
      {showMessage && savedError && (
        <Alert
          type="error"
          headingLevel="h2"
          slim
          role="alert"
          className="margin-top-0 margin-bottom-3 tablet-lg:maxw-tablet"
          data-testid="opportunity-save-error"
        >
          {errorText}
        </Alert>
      )}
      {opportunityTitle ? (
        <h1 className="margin-top-0 margin-bottom-3 font-sans-lg tablet-lg:font-sans-xl">
          {opportunityTitle}
        </h1>
      ) : null}
      <div className="display-flex flex-column tablet-lg:flex-row">
        <div className="flex-1">{details}</div>
        <div className="margin-top-3 tablet-lg:margin-top-0 tablet-lg:margin-left-4">
          <div className="opportunity-header__buttons">
            {saveControl}
            {applyAction}
          </div>
          {/* persistent live region so save results are announced after they are rendered */}
          <div
            role="status"
            className="display-flex flex-justify-end"
            data-testid="opportunity-save-message"
          >
            {showMessage && !savedError && (
              <SimplerAlert
                type="success"
                buttonId={SAVE_BUTTON_ID}
                messageText={successText}
                alertClick={dismissSuccessMessage}
                closeButtonLabel={t("saveMessage.dismiss")}
                className="margin-left-0 margin-top-105 shadow-2"
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};
