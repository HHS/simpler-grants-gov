"use client";

import {
  Status,
  type ApplicationDetail,
  type SamGovEntity,
} from "src/types/applicationResponseTypes";
import type { Competition } from "src/types/competitionsResponseTypes";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Button,
  Grid,
  GridContainer,
  Link,
  type ModalRef,
} from "@trussworks/react-uswds";

import { EditAppFilingName } from "src/components/application/editAppFilingName/EditAppFilingName";
import { TransferOwnershipModal } from "src/components/application/transferOwnership/TransferOwnershipModal";
import { InlineActionLink } from "src/components/InlineActionLink";
import { USWDSIcon } from "src/components/USWDSIcon";
import { TransferOwnershipButton } from "./transferOwnership/TransferOwnershipButton";

type CompetitionDetails = { competition: Competition };

export type ApplicationDetailsCardProps = ApplicationDetail &
  CompetitionDetails;

const OrganizationDetailsDisplay = ({
  samGovEntity,
}: {
  samGovEntity?: SamGovEntity;
}) => {
  const t = useTranslations("Application.information");
  const { expiration_date, legal_business_name, uei } = samGovEntity ?? {};

  return (
    <>
      <div className="margin-bottom-1">
        <dt className="margin-right-1 text-bold">{t("applicant")}: </dt>
        <dd>{legal_business_name ?? "-"}</dd>
      </div>
      <Grid row className="margin-bottom-1">
        <div>
          <dt className="margin-right-1 text-bold">{t("uei")}: </dt>
          <dd>{uei ?? "-"}</dd>
        </div>
        <div className="margin-left-4">
          <dt className="margin-right-1 text-bold">{t("renewal")}: </dt>
          <dd>{expiration_date ?? "-"}</dd>
        </div>
      </Grid>
    </>
  );
};

const ApplicantDetails = ({
  hasOrganization,
  samGovEntity,
  onOpenTransferModal,
}: {
  hasOrganization: boolean;
  samGovEntity?: SamGovEntity;
  onOpenTransferModal: () => void;
}) => {
  const t = useTranslations("Application.information");

  if (hasOrganization) {
    return <OrganizationDetailsDisplay samGovEntity={samGovEntity} />;
  }

  return (
    <div className="margin-bottom-1">
      <dt className="margin-right-1 text-bold">{t("applicant")}: </dt>
      <dd>
        {t("applicantTypeIndividual")}
        <TransferOwnershipButton onClick={onOpenTransferModal} />
      </dd>
    </div>
  );
};

const getApplicationStatusLabel = (
  applicationStatus: string,
  t: ReturnType<typeof useTranslations>,
): string => {
  switch (applicationStatus) {
    case Status.ACCEPTED:
      return t("statusAccepted");
    case Status.IN_PROGRESS:
      return t("statusInProgress");
    case Status.SUBMITTED:
      return t("statusSubmitted");
    default:
      return "-";
  }
};

const isOpportunityOrganizationOnly = (
  opportunityApplicantTypes: string[],
): boolean => {
  // "unrestricted" can also mean individuals are allowed.
  const allowsIndividuals =
    opportunityApplicantTypes.includes("individuals") ||
    opportunityApplicantTypes.includes("unrestricted");

  return !allowsIndividuals;
};

export const InformationCard = ({
  applicationDetails,
  applicationSubmitHandler,
  applicationSubmitted,
  opportunityName,
  submissionLoading,
  instructionsDownloadPath,
  opportunityApplicantTypes,
}: {
  applicationDetails: ApplicationDetailsCardProps;
  applicationSubmitHandler: () => void;
  applicationSubmitted: boolean;
  opportunityName: string | null;
  submissionLoading: boolean;
  instructionsDownloadPath: string;
  opportunityApplicantTypes: string[];
}) => {
  const t = useTranslations("Application.information");

  const hasOrganization = Boolean(applicationDetails.organization);
  const competitionIsOpen = applicationDetails.competition.is_open;

  // Single source of truth for the transfer modal
  const transferModalRef = useRef<ModalRef | null>(null);
  const transferModalId = "transfer-ownership-modal";

  const [isTransferModalOpen, setIsTransferModalOpen] =
    useState<boolean>(false);

  const openTransferModal = useCallback((): void => {
    setIsTransferModalOpen(true);
  }, []);

  const handleTransferModalAfterClose = useCallback((): void => {
    setIsTransferModalOpen(false);
  }, []);

  // open the modal once it exists in the DOM
  useEffect(() => {
    if (!isTransferModalOpen) {
      return;
    }
    transferModalRef.current?.toggleModal?.();
  }, [isTransferModalOpen]);

  const submitBlockedByEligibility = useMemo((): boolean => {
    const opportunityIsOrgOnly = isOpportunityOrganizationOnly(
      opportunityApplicantTypes,
    );
    return opportunityIsOrgOnly && !hasOrganization;
  }, [hasOrganization, opportunityApplicantTypes]);

  const submitDisabled =
    submissionLoading || isTransferModalOpen || submitBlockedByEligibility;

  const alertBody = t.rich("unassociatedApplicationAlert.body", {
    link: (content) => (
      <InlineActionLink onClick={openTransferModal}>{content}</InlineActionLink>
    ),
  });

  const ApplicationInstructionsDownload = () => {
    return (
      <div className="margin-bottom-1 margin-left-0">
        <dt className="usa-sr-only">
          {t("applicationDownloadInstructionsLabel")}:
        </dt>
        <dd className="margin-left-0">
          {instructionsDownloadPath ? (
            <Link href={instructionsDownloadPath}>
              <Button
                type="button"
                data-testid="application-instructions-download"
                outline
              >
                <USWDSIcon name="file_download" />
                {t("applicationDownloadInstructions")}
              </Button>
            </Link>
          ) : null}
        </dd>
      </div>
    );
  };

  const NoApplicationInstructionsDownload = () => {
    return (
      <div className="margin-bottom-1 margin-left-0">
        <dt className="margin-right-1 text-bold">
          {t("applicationDownloadInstructionsLabel")}:
        </dt>
        <dd>-</dd>
      </div>
    );
  };

  const SpecialInstructions = () => {
    return (
      <div>
        <dt className="usa-sr-only">{t("specialInstructionsLabel")}:</dt>
        <dd className="margin-right-1 text-bold text-orange">
          {t("specialInstructions")}
        </dd>
      </div>
    );
  };

  return (
    <>
      {submitBlockedByEligibility ? (
        <Grid tablet={{ col: 12 }} mobile={{ col: 12 }}>
          <Alert
            type="warning"
            noIcon
            headingLevel="h2"
            heading={t("unassociatedApplicationAlert.title")}
            className="margin-top-2"
          >
            {alertBody}
          </Alert>
        </Grid>
      ) : null}

      {isTransferModalOpen ? (
        <TransferOwnershipModal
          applicationId={applicationDetails.application_id}
          modalId={transferModalId}
          modalRef={transferModalRef}
          onAfterClose={handleTransferModalAfterClose}
        />
      ) : null}

      <GridContainer
        data-testid="information-card"
        className="border radius-md border-base-lighter padding-x-2 margin-y-4"
      >
        <Grid row gap>
          <Grid tablet={{ col: 12 }} mobile={{ col: 12 }}>
            <h3 className="margin-top-2">
              {applicationDetails.application_name}
              {applicationDetails.application_status !== Status.SUBMITTED &&
                applicationDetails.application_status !== Status.ACCEPTED && (
                  <EditAppFilingName
                    applicationId={applicationDetails.application_id}
                    applicationName={applicationDetails.application_name}
                    opportunityName={opportunityName}
                  />
                )}
            </h3>
          </Grid>

          <Grid tablet={{ col: 6 }} mobile={{ col: 12 }}>
            <dl>
              <ApplicantDetails
                hasOrganization={hasOrganization}
                samGovEntity={applicationDetails.organization?.sam_gov_entity}
                onOpenTransferModal={openTransferModal}
              />
            </dl>
          </Grid>

          <Grid tablet={{ col: 6 }} mobile={{ col: 12 }}>
            <dl>
              <div className="margin-bottom-1">
                <dt className="margin-right-1 text-bold">
                  {competitionIsOpen ? t("closeDate") : t("closed")}:
                </dt>
                <dd className="margin-right-1">
                  <span className="text-bold text-orange">
                    {applicationDetails.competition.closing_date}
                  </span>{" "}
                  (11:59pm ET)
                </dd>
              </div>

              {!competitionIsOpen ? <SpecialInstructions /> : null}

              <div className="margin-bottom-1">
                <dt className="margin-right-1 text-bold">
                  {t("statusLabel")}:
                </dt>
                <dd className="margin-right-1 text-bold text-orange">
                  {getApplicationStatusLabel(
                    applicationDetails.application_status,
                    t,
                  )}
                </dd>
              </div>
            </dl>
          </Grid>

          <Grid tablet={{ col: 6 }} mobile={{ col: 12 }}>
            {applicationDetails.competition.competition_instructions.length ? (
              <ApplicationInstructionsDownload />
            ) : (
              <NoApplicationInstructionsDownload />
            )}
          </Grid>

          <Grid tablet={{ col: 6 }} mobile={{ col: 12 }}>
            {!applicationSubmitted && competitionIsOpen ? (
              <SubmitApplicationButton
                buttonText={t("submit")}
                onSubmit={applicationSubmitHandler}
                isDisabled={submitDisabled}
                isSubmitting={submissionLoading}
              />
            ) : null}
          </Grid>
        </Grid>
      </GridContainer>
    </>
  );
};

export const SubmitApplicationButton = ({
  buttonText,
  isDisabled,
  isSubmitting,
  onSubmit,
}: {
  buttonText: string;
  isDisabled: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
}) => {
  return (
    <Button type="button" disabled={isDisabled} onClick={onSubmit}>
      <USWDSIcon name="upload_file" />
      {isSubmitting ? "Loading... " : buttonText}
    </Button>
  );
};
