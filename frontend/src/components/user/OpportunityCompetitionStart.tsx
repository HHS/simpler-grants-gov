"use client";

import { useUser } from "src/services/auth/useUser";
import { startApplication } from "src/services/fetch/fetchers/clientApplicationFetcher";
import { Competition } from "src/types/competitionsResponseTypes";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { RefObject, useCallback, useRef, useState } from "react";
import {
  Button,
  ErrorMessage,
  FormGroup,
  Label,
  ModalFooter,
  ModalRef,
  ModalToggleButton,
  TextInput,
} from "@trussworks/react-uswds";

import { SimplerModal } from "src/components/SimplerModal";
import { USWDSIcon } from "src/components/USWDSIcon";

export const OpportunityCompetitionStart = ({
  competitions,
}: {
  competitions: [Competition];
}) => {
  const { user } = useUser();
  // const { checkFeatureFlag } = useFeatureFlags();

  const openCompetitions = competitionData({ competitions });

  if (!openCompetitions.length || !user?.token) {
    return <></>;
  } else {
    return (
      <>
        <StartApplicationModal
          competitionTitle={openCompetitions[0].competition_title}
          competitionId={openCompetitions[0].competition_id}
        />
      </>
    );
  }
};

type StartApplicationModalProps = {
  competitionId: string;
  competitionTitle: string;
};

const StartApplicationModal = ({
  competitionId,
  competitionTitle,
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
      <ModalToggleButton modalRef={modalRef} opener className="usa-button">
        <USWDSIcon name="add" />
        {t("startApplicationButtonText")}
      </ModalToggleButton>
      <SimplerModal
        modalRef={modalRef}
        className="text-wrap"
        modalId={modalId}
        titleText={t("startAppplicationModal.title")}
        onKeyDown={(e) => {
          if (e.key === "Enter") onClose();
        }}
        onClose={onClose}
      >
        <IndividiualCompetitionStartForm
          competitionTitle={competitionTitle}
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

export const IndividiualCompetitionStartForm = ({
  competitionTitle,
  error = "",
  loading = false,
  modalRef,
  onChange,
  onClose,
  onSubmit,
  validationError = "",
}: {
  competitionTitle: string;
  loading?: boolean;
  error?: string;
  modalRef: RefObject<ModalRef | null>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClose: () => void;
  onSubmit: () => void;
  validationError?: string;
}) => {
  const t = useTranslations("OpportunityListing");

  return (
    <div className="display-flex flex-align-start">
      <FormGroup error={!!validationError}>
        <p className="font-sans-md">{competitionTitle}</p>
        <p>{t("startAppplicationModal.requiredText")}</p>
        <Label id={`label-for-name`} key={`label-for-name`} htmlFor="name">
          {t("startAppplicationModal.name")}
          <span>
            <br /> {t("startAppplicationModal.description")}
          </span>
        </Label>
        {validationError && <ErrorMessage>{validationError}</ErrorMessage>}
        {error && <ErrorMessage>{error}</ErrorMessage>}

        <TextInput
          type="text"
          name="application-name"
          id="application-name"
          onChange={onChange}
        />
        <ModalFooter>
          <Button onClick={onSubmit} type="button">
            {loading
              ? "loading..."
              : t("startAppplicationModal.saveButtonText")}
          </Button>
          <ModalToggleButton
            modalRef={modalRef}
            closer
            unstyled
            className="padding-105 text-center"
            onClick={onClose}
          >
            {t("startAppplicationModal.cancelButtonText")}
          </ModalToggleButton>
        </ModalFooter>
      </FormGroup>
    </div>
  );
};

export const competitionData = ({
  competitions,
}: {
  competitions: [Competition];
}) => {
  return competitions.reduce<Competition[]>((acc, competition) => {
    const todayDate = new Date();
    const openingDate = new Date(competition.opening_date);
    const closingDate = new Date(competition.closing_date);
    if (
      competition.is_open &&
      todayDate >= openingDate &&
      todayDate <= closingDate
    ) {
      acc.push(competition);
    }
    return acc;
  }, []);
};
