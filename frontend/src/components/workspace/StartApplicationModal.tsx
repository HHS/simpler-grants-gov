"use client";

import { useUser } from "src/services/auth/useUser";
import { startApplication } from "src/services/fetch/fetchers/clientApplicationFetcher";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { ModalRef, ModalToggleButton } from "@trussworks/react-uswds";

import { LoginModal } from "src/components/LoginModal";
import { SimplerModal } from "src/components/SimplerModal";
import { USWDSIcon } from "src/components/USWDSIcon";
import { CompetitionStartForm } from "src/components/workspace/CompetitionStartFormIndividiual";

type StartApplicationModalProps = {
  competitionId: string;
  opportunityTitle: string;
};

const StartApplicationModal = ({
  competitionId,
  opportunityTitle,
}: StartApplicationModalProps) => {
  const modalRef = useRef<ModalRef>(null);
  const { user } = useUser();
  const router = useRouter();
  const t = useTranslations("OpportunityListing");
  const headerTranslation = useTranslations("HeaderLoginModal");

  const [validationError, setValidationError] = useState<string>();
  const [savedApplicationName, setSavedApplicationName] = useState<string>();
  const [selectedOrganization, setSelectedOrganization] = useState<string>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState<boolean>();

  const token = user?.token || null;

  const handleSubmit = useCallback(() => {
    if (!token) {
      return;
    }
    if (validationError) {
      setValidationError(undefined);
    }
    if (!savedApplicationName) {
      setValidationError(
        t("startApplicationModal.fields.name.validationError"),
      );
      return;
    }
    setLoading(true);
    startApplication(savedApplicationName, competitionId, token)
      .then((data) => {
        const { applicationId } = data;
        router.push(`/workspace/applications/application/${applicationId}`);
      })
      .catch((error) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (error.cause === "401") {
          setError(t("startApplicationModal.loggedOut"));
        } else {
          setError(t("startApplicationModal.error"));
        }
        console.error(error);
      });
  }, [competitionId, router, savedApplicationName, t, token, validationError]);

  const onClose = useCallback(() => {
    setError("");
    setLoading(false);
    setValidationError(undefined);
    setSavedApplicationName("");
  }, []);

  const onNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSavedApplicationName(e.target.value);
  }, []);

  const onOrganizationChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedOrganization(e.target.value);
    },
    [],
  );
  return (
    <div className="display-flex flex-align-start">
      <ModalToggleButton
        modalRef={modalRef}
        data-testid={`open-start-application-modal-button`}
        opener
        className="usa-button"
      >
        <USWDSIcon name="add" />
        {t("startApplicationButtonText")}
      </ModalToggleButton>
      {token ? (
        <SimplerModal
          modalRef={modalRef}
          className="text-wrap"
          modalId={"start-application"}
          titleText={
            token
              ? t("startApplicationModal.title")
              : t("startApplicationModal.login")
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          onClose={onClose}
        >
          <CompetitionStartForm
            opportunityTitle={opportunityTitle}
            loading={loading}
            error={error}
            onClose={onClose}
            onSubmit={handleSubmit}
            onNameChange={onNameChange}
            onOrganizationChange={onOrganizationChange}
            modalRef={modalRef}
            validationError={validationError}
            selectedOrganization={selectedOrganization}
          />
        </SimplerModal>
      ) : (
        <LoginModal
          helpText={headerTranslation("help")}
          buttonText={headerTranslation("button")}
          closeText={headerTranslation("close")}
          descriptionText={headerTranslation("description")}
          titleText={headerTranslation("title")}
          modalId="application-login-modal"
          modalRef={modalRef as React.RefObject<ModalRef>}
        />
      )}
    </div>
  );
};

export default StartApplicationModal;
