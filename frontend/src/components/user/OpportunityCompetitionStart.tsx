"use client";

import { useUser } from "src/services/auth/useUser";
import { startApplication } from "src/services/fetch/fetchers/clientApplicationFetcher";
import { Competition } from "src/types/competitionsResponseTypes";

import { useTranslations } from "next-intl";
     import { useRouter } from 'next/navigation';
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
  const [apiError, setApiError] = useState<boolean>();
  const [loading, setLoading] = useState<boolean>();
  const [saved, setSaved] = useState<boolean>();

  const handleSubmit = useCallback(() => {
    if (!user?.token) return;

    if (validationError) {
      setValidationError(undefined);
    }
    console.log("going", savedSearchName);
    if (!savedSearchName) {
      setValidationError("Please enter a name for your application.");
      return;
    }
    setLoading(true);
    startApplication(competitionId, savedSearchName, user.token)
      .then((data) => {
        console.log("data", data);
        const { applicationId } = data;
        router.push(`/workspace/applications/application/${applicationId}`);
      })
      .catch((error) => {
        console.log("error", error);
        console.error(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router, user, savedSearchName, validationError]);

  const onClose = useCallback(() => {
    setSaved(false);
    setApiError(false);
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
  modalRef,
  onChange,
  onClose,
  onSubmit,
  validationError = "",
}: {
  competitionTitle: string;
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

        <TextInput
          type="text"
          name="application-name"
          id="application-name"
          onChange={onChange}
        />
        <ModalFooter>
          <Button onClick={onSubmit} type="button">
            {t("startAppplicationModal.saveButtonText")}
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
