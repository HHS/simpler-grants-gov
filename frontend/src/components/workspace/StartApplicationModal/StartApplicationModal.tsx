import { useClientFetch } from "src/hooks/useClientFetch";
import { ApplicantTypes } from "src/types/competitionsResponseTypes";
import { UserOrganization } from "src/types/userTypes";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { RefObject, useCallback, useState } from "react";
import {
  Alert,
  Button,
  ErrorMessage,
  FormGroup,
  ModalFooter,
  ModalRef,
  ModalToggleButton,
} from "@trussworks/react-uswds";

import { SimplerModal } from "src/components/SimplerModal";
import { USWDSIcon } from "src/components/USWDSIcon";
import { IneligibleApplicationStart } from "./IneligibleStartApplicationModal";
import { StartApplicationDescription } from "./StartApplicationDescription";
import { StartApplicationInfoBanner } from "./StartApplicationInfoBanner";
import {
  SPECIAL_VALUES,
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
  organizationsError,
  competitionId,
}: {
  opportunityTitle: string;
  modalRef: RefObject<ModalRef | null>;
  applicantTypes: ApplicantTypes[];
  organizations: UserOrganization[];
  token: string | null;
  loading: boolean;
  organizationsError?: boolean;
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

    // Check if individual or not-listed was selected
    const isIndividualSelected =
      selectedOrganization === SPECIAL_VALUES.INDIVIDUAL;
    const isNotListedSelected =
      selectedOrganization === SPECIAL_VALUES.NOT_LISTED;

    // Organization required unless user explicitly selected individual or not-listed
    const skipOrgValidation = isIndividualSelected || isNotListedSelected;

    if (!skipOrgValidation && !selectedOrganization) {
      setOrgValidationError(t("fields.organizationSelect.validationError"));
      valid = false;
    }

    return valid;
  }, [token, savedApplicationName, selectedOrganization, t]);

  const handleSubmit = useCallback(() => {
    const valid = validateSubmission();
    if (!valid) {
      return;
    }
    setUpdating(true);

    // Determine organization_id to send to API
    let organizationToSend: string | undefined;
    if (
      selectedOrganization === SPECIAL_VALUES.INDIVIDUAL ||
      selectedOrganization === SPECIAL_VALUES.NOT_LISTED
    ) {
      organizationToSend = undefined; // Individual applications
    } else {
      organizationToSend = selectedOrganization; // Organization applications
    }

    clientFetch("/api/applications/start", {
      method: "POST",
      body: JSON.stringify({
        applicationName: savedApplicationName,
        competitionId,
        organization: organizationToSend,
      }),
    })
      .then((data) => {
        const { applicationId } = data;
        router.push(`/applications/${applicationId}`);
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

  // Only show ineligible screen if there's no API error and legitimately no organizations
  if (
    !organizationsError &&
    !organizations.length &&
    !applicantTypes.includes("individual")
  ) {
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
      onKeyDown={(e) => {
        if (e.key === "Enter") handleSubmit();
      }}
      onClose={onClose}
    >
      {organizationsError && (
        <Alert
          type="error"
          headingLevel="h4"
          noIcon={true}
          slim={true}
          className="margin-bottom-2"
        >
          {t.rich("organizationLoadError", {
            telephone: (chunk) => <a href="tel:18005184726">{chunk}</a>,
            email: (chunk) => <a href="mailto:simpler@grants.gov">{chunk}</a>,
            br: () => <br />,
          })}
        </Alert>
      )}
      <h1 className="usa-modal__heading" id="start-application-heading">
        {t("title")}
      </h1>
      <StartApplicationDescription
        organizations={organizations}
        applicantTypes={applicantTypes}
      />
      <p className="font-sans-2xs text-base margin-top-1 margin-bottom-0">
        {t("requiredText")}
      </p>
      <p className="font-sans-sm text-bold" data-testid="opportunity-title">
        {t("applyingFor")} {opportunityTitle}
      </p>
      <hr className="margin-y-2 border-base-lighter" />
      <StartApplicationInfoBanner />
      {applicantTypes.includes("organization") && (
        <FormGroup error={!!orgValidationError} className="margin-top-1">
          <StartApplicationOrganizationInput
            onOrganizationChange={onOrganizationChange}
            validationError={orgValidationError}
            organizations={organizations}
            selectedOrganization={selectedOrganization}
            applicantTypes={applicantTypes}
          />
        </FormGroup>
      )}
      <FormGroup error={!!nameValidationError} className="margin-top-1">
        <StartApplicationNameInput
          validationError={nameValidationError}
          onNameChange={onNameChange}
        />
      </FormGroup>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <ModalFooter>
        <Button
          onClick={handleSubmit}
          type="button"
          data-testid="application-start-save"
          disabled={!!loading}
        >
          <USWDSIcon
            name="add"
            className="margin-right-05"
            aria-hidden="true"
          />
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
