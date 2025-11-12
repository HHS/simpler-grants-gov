import { useClientFetch } from "src/hooks/useClientFetch";
import { ApplicantTypes } from "src/types/competitionsResponseTypes";
import { UserOrganization } from "src/types/userTypes";
import { addCacheBuster } from "src/utils/cacheBuster";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { RefObject, useCallback, useState } from "react";
import {
  Button,
  ErrorMessage,
  FormGroup,
  ModalFooter,
  ModalRef,
  ModalToggleButton,
} from "@trussworks/react-uswds";

import { SimplerModal } from "src/components/SimplerModal";
import { IneligibleApplicationStart } from "./IneligibleStartApplicationModal";
import { StartApplicationDescription } from "./StartApplicationDescription";
import {
  StartApplicationNameInput,
  StartApplicationOrganizationInput,
} from "./StartApplicationInputs";

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

  const [nameValidationError, setNameValidationError] = useState<string>();
  const [orgValidationError, setOrgValidationError] = useState<string>();
  const [savedApplicationName, setSavedApplicationName] = useState<string>();
  const [selectedOrganization, setSelectedOrganization] = useState<string>();
  const [error, setError] = useState<string>();
  const [updating, setUpdating] = useState<boolean>();

  const validateSubmission = useCallback((): boolean => {
    let valid = !!token;

    setOrgValidationError("");
    setNameValidationError("");

    if (!savedApplicationName) {
      setNameValidationError(t("fields.name.validationError"));
      valid = false;
    }
    if (!applicantTypes.includes("individual") && !selectedOrganization) {
      setOrgValidationError(t("fields.organizationSelect.validationError"));
      valid = false;
    }
    return valid;
  }, [token, savedApplicationName, applicantTypes, selectedOrganization, t]);

  const handleSubmit = useCallback(() => {
    const valid = validateSubmission();
    if (!valid) {
      return;
    }
    setUpdating(true);
    clientFetch("/api/applications/start", {
      method: "POST",
      body: JSON.stringify({
        applicationName: savedApplicationName,
        competitionId,
        organization: selectedOrganization,
      }),
    })
      .then((data) => {
        const { applicationId } = data;
        // Add cache buster for authenticated user navigation
        const url = `/workspace/applications/application/${applicationId}`;
        router.push(token ? addCacheBuster(url) : url);
      })
      .catch((error) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (error.cause === "401") {
          setError(t("loggedOut"));
        } else {
          setError(t("error"));
        }
        console.error(error);
      })
      .finally(() => {
        setUpdating(false);
      });
  }, [
    competitionId,
    router,
    savedApplicationName,
    t,
    selectedOrganization,
    validateSubmission,
    clientFetch,
    token,
  ]);

  const onClose = useCallback(() => {
    setError("");
    setUpdating(false);
    setNameValidationError("");
    setOrgValidationError("");
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

  if (!organizations.length && !applicantTypes.includes("individual")) {
    return (
      <IneligibleApplicationStart
        modalRef={modalRef}
        cancelText={t("cancelButtonText")}
        onClose={onClose}
        organizations={organizations}
        applicantTypes={applicantTypes}
      />
    );
  }
  return (
    <SimplerModal
      modalRef={modalRef}
      className="text-wrap maxw-tablet-lg font-sans-xs"
      modalId={"start-application"}
      titleText={t("title")}
      onKeyDown={(e) => {
        if (e.key === "Enter") handleSubmit();
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
      <FormGroup
        error={!!(nameValidationError || orgValidationError || error)}
        className="margin-top-1"
      >
        {applicantTypes.includes("organization") && (
          <StartApplicationOrganizationInput
            onOrganizationChange={onOrganizationChange}
            validationError={orgValidationError}
            organizations={organizations}
            selectedOrganization={selectedOrganization}
          />
        )}
        <StartApplicationNameInput
          validationError={nameValidationError}
          onNameChange={onNameChange}
        />
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </FormGroup>
      <ModalFooter>
        <Button
          onClick={handleSubmit}
          type="button"
          data-testid="application-start-save"
          disabled={!!loading}
        >
          {loading || updating ? "Loading..." : t("saveButtonText")}
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
