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
  opportunityTitle,
  error = "",
  loading = false,
  modalRef,
  onChange,
  onClose,
  onSubmit,
  validationError = "",
}: {
  opportunityTitle: string;
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
      <FormGroup error={!!validationError} className="margin-top-1">
        <p className="font-sans-sm" data-testid="opportunity-title">
          {opportunityTitle}
        </p>
        <p className="font-sans-3xs">
          {t("startApplicationModal.requiredText")}
        </p>
        <Label
          id={`label-for-name`}
          key={`label-for-name`}
          htmlFor="application-name"
          className="font-sans-2xs"
        >
          {t("startApplicationModal.name")}
          <span>
            <br /> {t("startApplicationModal.description")}
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
            disabled={!!loading}
          >
            {loading ? "loading..." : t("startApplicationModal.saveButtonText")}
          </Button>
          <ModalToggleButton
            modalRef={modalRef}
            closer
            unstyled
            className="padding-105 text-center"
            onClick={onClose}
          >
            {t("startApplicationModal.cancelButtonText")}
          </ModalToggleButton>
        </ModalFooter>
      </FormGroup>
    </div>
  );
};

export default CompetitionStartFormIndividiual;
