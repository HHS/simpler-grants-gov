"use client";

import { ApplicationSubmission } from "src/types/application/applicationSubmissionTypes";
import {
  Status,
  type ApplicationDetail,
  type SamGovEntity,
} from "src/types/applicationResponseTypes";
import type {
  ApplicantTypes,
  Competition,
} from "src/types/competitionsResponseTypes";

import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
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
  competitionAllowsOrganizations,
}: {
  hasOrganization: boolean;
  samGovEntity?: SamGovEntity;
  onOpenTransferModal: () => void;
  competitionAllowsOrganizations: boolean;
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
        {competitionAllowsOrganizations ? (
          <TransferOwnershipButton onClick={onOpenTransferModal} />
        ) : null}
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

const isCompetitionOrganizationOnly = (
  openToApplicants: ApplicantTypes[],
): boolean =>
  openToApplicants.includes("organization") &&
  !openToApplicants.includes("individual");

export const InformationCard = ({
  applicationDetails,
  applicationSubmitHandler,
  applicationSubmitted,
  opportunityName,
  submissionLoading,
  instructionsDownloadPath,
  latestApplicationSubmission,
}: {
  applicationDetails: ApplicationDetailsCardProps;
  applicationSubmitHandler: () => void;
  applicationSubmitted: boolean;
  opportunityName: string | null;
  submissionLoading: boolean;
  instructionsDownloadPath: string;
  latestApplicationSubmission: ApplicationSubmission | null;
}) => {
  const t = useTranslations("Application.information");

  const hasOrganization = Boolean(applicationDetails.organization);
  const competitionIsOpen = applicationDetails.competition.is_open;

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

  useEffect(() => {
    if (!isTransferModalOpen) {
      return;
    }
    transferModalRef.current?.toggleModal?.();
  }, [isTransferModalOpen]);

  const submitBlockedByEligibility = useMemo((): boolean => {
    const orgOnly = isCompetitionOrganizationOnly(
      applicationDetails.competition.open_to_applicants,
    );
    return orgOnly && !hasOrganization;
  }, [applicationDetails.competition.open_to_applicants, hasOrganization]);

  const submitDisabled =
    submissionLoading || isTransferModalOpen || submitBlockedByEligibility;

  const alertBody: ReactNode = t.rich("unassociatedApplicationAlert.body", {
    link: (content) => (
      <InlineActionLink onClick={openTransferModal}>{content}</InlineActionLink>
    ),
  });
  const competitionAllowsOrganizations =
    applicationDetails.competition.open_to_applicants.includes("organization");

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

  /**
   * Application submission download will only be available when an application has
   * a status of ACCEPTED. The following are cases of each application status
   *
   * IN_PROGRESS
   *  - Has not been submitted, so do not render anything related to submission.
   * SUBMITTED
   *  - Submitted but does not yet have submission db entry and S3 download not available yet.
   *  - Show message that download is being prepared.
   * ACCEPTED
   *  - Download available, render button to download submission zip.
   */
  const ApplicationSubmissionDownload = () => {
    if (applicationDetails.application_status === Status.SUBMITTED)
      return (
        <p data-testid={"application-submission-download-message"}>
          {t("applicationSubmissionZipDownloadLoadingMessage")}
        </p>
      );
    if (
      latestApplicationSubmission === null ||
      applicationDetails.application_status === Status.IN_PROGRESS
    )
      return null;
    return (
      <Link href={latestApplicationSubmission.download_path}>
        <Button
          type="button"
          data-testid="application-submission-download"
          disabled={submissionLoading}
          outline
        >
          <USWDSIcon name="file_download" />
          {t("applicationSubmissionZipDownload")}
        </Button>
      </Link>
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

  const applicationStatus = () => {
    switch (applicationDetails.application_status) {
      case Status.IN_PROGRESS:
        return t("statusInProgress");
      case Status.ACCEPTED:
      case Status.SUBMITTED:
        return t("statusSubmitted");
      default:
        return "-";
    }
  };

  const InformationCardDetails = ({
    applicationSubmitHandler,
  }: {
    applicationSubmitHandler: () => void;
  }) => {
    return (
      <>
        {/*
          TODO: Edit functionality in future task
        */}
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
            />
          </dl>
        </Grid>

        <Grid tablet={{ col: 6 }} mobile={{ col: 12 }}>
          <dl>
            <div className="margin-bottom-1">
              <dt className="margin-right-1 text-bold">
                {applicationDetails.competition.is_open
                  ? t("closeDate")
                  : t("closed")}
                :{" "}
              </dt>
              <dd className="margin-right-1">
                <span className="text-bold text-orange">
                  {applicationDetails.competition.closing_date}
                </span>{" "}
                (11:59pm ET)
              </dd>
            </div>
            {!is_open ? <SpecialInstructions /> : null}
            <div className="margin-bottom-1">
              <dt className="margin-right-1 text-bold">{t("statusLabel")}:</dt>
              <dd className="margin-right-1 text-bold text-orange">
                {applicationStatus()}
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

        <Grid
          tablet={{ col: 6 }}
          mobile={{ col: 12 }}
          className={"margin-bottom-2"}
        >
          {!applicationSubmitted && is_open && (
            <SubmitApplicationButton
              buttonText={t("submit")}
              submitHandler={applicationSubmitHandler}
              loading={submissionLoading}
            />
          )}
          <ApplicationSubmissionDownload />
        </Grid>
      </>
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
            data-testid="unassociated-application-alert"
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
                competitionAllowsOrganizations={competitionAllowsOrganizations}
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
