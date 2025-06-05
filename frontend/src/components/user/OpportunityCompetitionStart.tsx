"use client";

import { useUser } from "src/services/auth/useUser";
import { Competition } from "src/types/competitionsResponseTypes";

import { useTranslations } from "next-intl";
import { RefObject, useRef } from "react";
import {
  Button,
  FormGroup,
  Label,
  ModalFooter,
  ModalRef,
  ModalToggleButton,
  TextInput,
} from "@trussworks/react-uswds";

import { SimplerModal } from "src/components/SimplerModal";
import { USWDSIcon } from "src/components/USWDSIcon";

const handleStartApplicationClose = () => {};

export const OpportunityCompetitionStart = ({
  competitions,
}: {
  competitions: [Competition];
}) => {
  const { user } = useUser();

  const openCompetitions = competitionData({ competitions });
  console.log(openCompetitions);
  if (!openCompetitions.length || !user?.token) {
    return <></>;
  } else {
    return (
      <>
        <StartApplicationModal
          competitionTitle={openCompetitions[0].competition_title}
          competitionId={openCompetitions[0].competition_id}
          onClose={handleStartApplicationClose}
        />
      </>
    );
  }
};

type StartApplicationModalProps = {
  competitionId: string;
  competitionTitle: string;
  error?: boolean;
  saved?: boolean;
  savedText?: string;
  onClose: () => void;
};

const StartApplicationModal = ({
  competitionId,
  competitionTitle,
  error,
  saved = false,
  savedText,
  onClose,
}: StartApplicationModalProps) => {
  const modalRef = useRef<ModalRef>(null);
  const t = useTranslations("OpportunityListing");
  const modalId = "start-application";

  return (
    <div className="display-flex flex-align-start">
      {error}

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
          cancelButtonText={t("startAppplicationModal.cancelButtonText")}
          competitionTitle={competitionTitle}
          competitionId={competitionId}
          description={t("startAppplicationModal.description")}
          name={t("startAppplicationModal.name")}
          requiredText={t("startAppplicationModal.requiredText")}
          saveButtonText={t("startAppplicationModal.saveButtonText")}
          onClose={onClose}
          modalRef={modalRef}
          modalId={modalId}
        />
      </SimplerModal>
    </div>
  );
};

export const IndividiualCompetitionStartForm = ({
  cancelButtonText,
  competitionId,
  competitionTitle,
  description,
  name,
  modalRef,
  modalId,
  onClose,
  saveButtonText,
  requiredText,
}: {
  cancelButtonText: string;
  competitionId: string;
  competitionTitle: string;
  name: string;
  description: string;
  modalRef: RefObject<ModalRef | null>;
  modalId: string;
  onClose: () => void;
  requiredText: string;
  saveButtonText: string;
}) => {
  return (
    <div className="display-flex flex-align-start">
      <FormGroup>
        <p className="font-sans-md">{competitionTitle}</p>
        <p>{requiredText}</p>
        <Label id={`label-for-name`} key={`label-for-name`} htmlFor="name">
          {name}
          {description && (
            <span>
              <br /> {description}
            </span>
          )}
        </Label>

        <TextInput type={"number"} name={"wtf"} id={"name"} />
        <ModalFooter>
          <Button type="button">{saveButtonText}</Button>
          <ModalToggleButton
            modalRef={modalRef}
            closer
            unstyled
            className="padding-105 text-center"
            onClick={onClose}
          >
            {cancelButtonText}
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
