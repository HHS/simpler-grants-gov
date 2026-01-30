"use client";

import { useClientFetch } from "src/hooks/useClientFetch";
import { ApplicantTypes } from "src/types/competitionsResponseTypes";
import { UserOrganization } from "src/types/userTypes";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import React, { RefObject, useCallback, useState } from "react";
import {
  Button,
  ErrorMessage,
  FormGroup,
  ModalFooter,
  ModalRef,
  ModalToggleButton,
} from "@trussworks/react-uswds";

import { SimplerModal } from "src/components/SimplerModal";
import { StartApplicationDescription } from "./StartApplicationDescription";
import {
  StartApplicationNameInput,
  StartApplicationOrganizationInput,
} from "./StartApplicationInputs";

type StartApplicationClientRequestBody = {
  applicationName: string;
  competitionId: string;
  organizationId?: string;
  intendsToAddOrganization?: boolean;
};

type ErrorWithCause = {
  cause?: unknown;
};

export const StartApplicationModal = ({
  opportunityTitle,
  modalRef,
  applicantTypes,
  organizations,
  token,
  loading,
  competitionId,
}: {
  opportunityTitle: string;
  modalRef: RefObject<ModalRef | null>;
  applicantTypes: ApplicantTypes[];
  organizations: UserOrganization[];
  token: string | null;
  loading: boolean;
  competitionId: string;
}) => {
  const t = useTranslations("OpportunityListing.startApplicationModal");
  const router = useRouter();

  const { clientFetch } = useClientFetch<{ applicationId: string }>(
    "Error starting application",
  );

  const [nameValidationError, setNameValidationError] = useState<string>("");
  const [savedApplicationName, setSavedApplicationName] = useState<string>("");
  const [selectedOrganization, setSelectedOrganization] = useState<string>("");
  const [requestErrorMessage, setRequestErrorMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const validateSubmission = useCallback((): boolean => {
    let isValid = Boolean(token);

    setNameValidationError("");

    if (!savedApplicationName) {
      setNameValidationError(t("fields.name.validationError"));
      isValid = false;
    }

    // Organization selection is optional even for org-only competitions.
    // Users can start as an individual and transfer ownership later.
    return isValid;
  }, [token, savedApplicationName, t]);

  const handleSubmit = useCallback(() => {
    const isValid = validateSubmission();
    if (!isValid) {
      return;
    }

    setIsSubmitting(true);

    const requestBody: StartApplicationClientRequestBody = {
      applicationName: savedApplicationName,
      competitionId,
    };

    if (selectedOrganization) {
      requestBody.organizationId = selectedOrganization;
      requestBody.intendsToAddOrganization = false;
    } else {
      requestBody.intendsToAddOrganization = true;
    }

    clientFetch("/api/applications/start", {
      method: "POST",
      body: JSON.stringify(requestBody),
    })
      .then((data) => {
        router.push(`/applications/${data.applicationId}`);
      })
      .catch((e: unknown) => {
        const maybeErrorWithCause = e as ErrorWithCause;
        if (maybeErrorWithCause.cause === "401") {
          setRequestErrorMessage(t("loggedOut"));
        } else {
          setRequestErrorMessage(t("error"));
        }
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }, [
    clientFetch,
    competitionId,
    router,
    savedApplicationName,
    selectedOrganization,
    t,
    validateSubmission,
  ]);

  const onClose = useCallback(() => {
    setRequestErrorMessage("");
    setIsSubmitting(false);
    setNameValidationError("");
    setSavedApplicationName("");
    setSelectedOrganization("");
  }, []);

  const onNameChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSavedApplicationName(event.target.value);
    },
    [],
  );
  const onOrganizationChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedOrganization(event.target.value);
    },
    [],
  );
  const hasAnyError = Boolean(nameValidationError || requestErrorMessage);
  return (
    <SimplerModal
      modalRef={modalRef}
      className="text-wrap maxw-tablet-lg font-sans-xs"
      modalId={"start-application"}
      titleText={t("title")}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          handleSubmit();
        }
      }}
      onClose={onClose}
    >
      <StartApplicationDescription
        organizations={organizations}
        applicantTypes={applicantTypes}
      />
      <p className="font-sans-sm text-bold" data-testid="opportunity-title">
        {t("applyingFor")} {opportunityTitle}
      </p>
      <p className="font-sans-3xs">{t("requiredText")}</p>
      <FormGroup error={hasAnyError} className="margin-top-1">
        {applicantTypes.includes("organization") ? (
          <StartApplicationOrganizationInput
            onOrganizationChange={onOrganizationChange}
            // Organization selection is optional at application start.
            // Validation is deferred until submission on the apply page.
            validationError={""}
            organizations={organizations}
            selectedOrganization={selectedOrganization}
          />
        ) : null}
        <StartApplicationNameInput
          validationError={nameValidationError}
          onNameChange={onNameChange}
        />
        {requestErrorMessage ? (
          <ErrorMessage>{requestErrorMessage}</ErrorMessage>
        ) : null}
      </FormGroup>
      <ModalFooter>
        <Button
          onClick={handleSubmit}
          type="button"
          data-testid="application-start-save"
          disabled={Boolean(loading) || isSubmitting}
        >
          {loading || isSubmitting ? "Loading..." : t("saveButtonText")}
        </Button>
        <ModalToggleButton
          modalRef={modalRef}
          closer
          unstyled
          className="padding-105 text-center"
          onClick={onClose}
        >
          {t("cancelButtonText")}
        </ModalToggleButton>
      </ModalFooter>
    </SimplerModal>
  );
};
