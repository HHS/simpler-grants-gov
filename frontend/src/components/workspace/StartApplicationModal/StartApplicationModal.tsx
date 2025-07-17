import { startApplication } from "src/services/fetch/fetchers/clientApplicationFetcher";
import { ApplicantTypes } from "src/types/competitionsResponseTypes";
import { Organization } from "src/types/UserTypes";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { RefObject, useCallback, useState } from "react";
import {
  Button,
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

const IneligibleApplicationStart = ({
  organizations,
  applicantTypes,
  modalRef,
  onClose,
  cancelText,
}: {
  organizations: Organization[];
  applicantTypes: ApplicantTypes[];
  modalRef: RefObject<ModalRef | null>;
  onClose: () => void;
  cancelText: string;
}) => {
  const t = useTranslations("OpportunityListing.startApplicationModal");
  return (
    <SimplerModal
      modalRef={modalRef}
      className="text-wrap maxw-tablet-lg font-sans-xs"
      modalId="start-application"
      titleText={t("ineligibleTitle")}
      onClose={onClose}
    >
      <StartApplicationDescription
        organizations={organizations}
        applicantTypes={applicantTypes}
      />
      <ModalFooter>
        <ModalToggleButton
          modalRef={modalRef}
          closer
          className="padding-105 text-center"
          onClick={onClose}
        >
          {cancelText}
        </ModalToggleButton>
      </ModalFooter>
    </SimplerModal>
  );
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
  organizations: Organization[];
  token: string | null;
  loading: boolean;
  competitionId: string;
}) => {
  const t = useTranslations("OpportunityListing.startApplicationModal");
  const router = useRouter();

  const [validationError, setValidationError] = useState<string>();
  const [savedApplicationName, setSavedApplicationName] = useState<string>();
  const [selectedOrganization, setSelectedOrganization] = useState<string>();
  const [error, setError] = useState<string>();
  const [updating, setUpdating] = useState<boolean>();

  const handleSubmit = useCallback(() => {
    if (!token) {
      return;
    }
    if (validationError) {
      setValidationError(undefined);
    }
    if (!savedApplicationName) {
      setValidationError(t("fields.name.validationError"));
      return;
    }
    setUpdating(true);
    startApplication(
      savedApplicationName,
      competitionId,
      selectedOrganization,
      token,
    )
      .then((data) => {
        const { applicationId } = data;
        router.push(`/workspace/applications/application/${applicationId}`);
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
    token,
    validationError,
    selectedOrganization,
  ]);

  const onClose = useCallback(() => {
    setError("");
    setUpdating(false);
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
      <FormGroup error={!!validationError} className="margin-top-1">
        {applicantTypes.includes("organization") && (
          <StartApplicationOrganizationInput
            error={error}
            onOrganizationChange={onOrganizationChange}
            validationError={validationError}
            organizations={organizations}
            selectedOrganization={selectedOrganization}
          />
        )}
        <StartApplicationNameInput
          error={error}
          validationError={validationError}
          onNameChange={onNameChange}
        />
      </FormGroup>
      <ModalFooter>
        <Button
          onClick={handleSubmit}
          type="button"
          data-testid="competition-start-individual-save"
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
