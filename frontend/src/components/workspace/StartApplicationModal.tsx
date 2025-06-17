"use client";

import { useUser } from "src/services/auth/useUser";
import { startApplication } from "src/services/fetch/fetchers/clientApplicationFetcher";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { ModalRef, ModalToggleButton } from "@trussworks/react-uswds";

import { SimplerModal } from "src/components/SimplerModal";
import { USWDSIcon } from "src/components/USWDSIcon";
import CompetitionStartFormIndividiual from "src/components/workspace/CompetitionStartFormIndividiual";

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
  const modalId = "start-application";
  const [validationError, setValidationError] = useState<string>();
  const [savedSearchName, setSavedSearchName] = useState<string>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState<boolean>();

  const handleSubmit = useCallback(() => {
    if (!user?.token) return;

    if (validationError) {
      setValidationError(undefined);
    }
    if (!savedSearchName) {
      setValidationError(t("startAppplicationModal.validationError"));
      return;
    }
    setLoading(true);
    startApplication(competitionId, savedSearchName, user.token)
      .then((data) => {
        const { applicationId } = data;
        router.push(`/workspace/applications/application/${applicationId}`);
      })
      .catch((error) => {
        setError(t("startAppplicationModal.error"));
        console.error(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [competitionId, router, savedSearchName, t, user, validationError]);

  const onClose = useCallback(() => {
    setError("");
    setLoading(false);
    setValidationError(undefined);
    setSavedSearchName("");
  }, []);

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSavedSearchName(e.target.value);
  }, []);

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
      <SimplerModal
        modalRef={modalRef}
        className="text-wrap"
        modalId={modalId}
        titleText={t("startAppplicationModal.title")}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
        }}
        onClose={onClose}
      >
        <CompetitionStartFormIndividiual
          opportunityTitle={opportunityTitle}
          loading={loading}
          error={error}
          onClose={onClose}
          onSubmit={handleSubmit}
          onChange={onChange}
          modalRef={modalRef}
          validationError={validationError}
        />
      </SimplerModal>
    </div>
  );
};

export default StartApplicationModal;
