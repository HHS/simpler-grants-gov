"use client";

import { useTranslations } from "next-intl";
import { RefObject } from "react";
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

const CompetitionStartFormIndividiual = ({
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
          <Button
            onClick={onSubmit}
            type="button"
            data-testid="competition-start-individual-save"
          >
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

export default CompetitionStartFormIndividiual;
