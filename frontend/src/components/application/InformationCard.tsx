"use client";

import { ApplicationSubmission } from "src/types/application/applicationSubmissionTypes";
import {
  ApplicationDetail,
  ApplicationStatus,
  SamGovEntity,
} from "src/types/applicationResponseTypes";
import { Competition } from "src/types/competitionsResponseTypes";

import { useTranslations } from "next-intl";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  Grid,
  GridContainer,
  Link,
  ModalRef,
  SummaryBox,
  SummaryBoxContent,
  SummaryBoxHeading,
} from "@trussworks/react-uswds";

import { EditAppFilingName } from "src/components/application/editAppFilingName/EditAppFilingName";
import { TransferOwnershipModal } from "src/components/application/transferOwnership/TransferOwnershipModal";
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

type InlineActionLinkProps = {
  onClick: () => void;
  children: ReactNode;
};

const InlineActionLink = ({ onClick, children }: InlineActionLinkProps) => {
  return (
    <Button type="button" onClick={onClick} className="text-underline" unstyled>
      {children}
    </Button>
  );
};

const ApplicantDetails = ({
  hasOrganization,
  samGovEntity,
  onOpenTransferModal,
  canTransferOwnership,
}: {
  hasOrganization: boolean;
  samGovEntity?: SamGovEntity;
  onOpenTransferModal: () => void;
  canTransferOwnership: boolean;
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
        {canTransferOwnership ? (
          <TransferOwnershipButton onClick={onOpenTransferModal} />
        ) : null}
      </dd>
    </div>
  );
};

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
  const { is_open } = applicationDetails.competition;
  const transferModalRef = useRef<ModalRef | null>(null);
  const transferModalId = "transfer-ownership-modal";
  const organizationEligible =
    applicationDetails.competition.open_to_applicants.includes("organization");
  const individualEligible =
    applicationDetails.competition.open_to_applicants.includes("individual");
  const isEditable =
    applicationDetails.application_status === ApplicationStatus.IN_PROGRESS;
  const canTransferOwnership =
    !hasOrganization && organizationEligible && isEditable;
  const isOrganizationOnlyCompetition =
    organizationEligible && !individualEligible;
  const isIndividualOwnedApplication = !hasOrganization;
  const shouldBlockSubmitForTransferOwnership =
    isIndividualOwnedApplication && isOrganizationOnlyCompetition;
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

  const ApplicationInstructionsDownload = () => {
    return (
      <div className="margin-bottom-1 margin-left-0">
        <dt className="usa-sr-only">
          {t("applicationDownloadInstructionsLabel")}:{" "}
        </dt>
        <dd className="margin-left-0">
          {instructionsDownloadPath && (
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
          )}
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
    if (applicationDetails.application_status === ApplicationStatus.SUBMITTED)
      return (
        <p data-testid={"application-submission-download-message"}>
          {t("applicationSubmissionZipDownloadLoadingMessage")}
        </p>
      );
    if (
      latestApplicationSubmission === null ||
      applicationDetails.application_status === ApplicationStatus.IN_PROGRESS
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
          {t("applicationDownloadInstructionsLabel")}:{" "}
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
      case ApplicationStatus.IN_PROGRESS:
        return t("statusInProgress");
      case ApplicationStatus.ACCEPTED:
      case ApplicationStatus.SUBMITTED:
        return t("statusSubmitted");
      default:
        return "-";
    }
  };

  const NeedsTransferOwnershipCta = () => {
    return (
      <SummaryBox className="simpler-summary-box-yellow">
        <SummaryBoxHeading headingLevel="h5" className="font-sans-md">
          {t("unassociatedApplicationAlert.title")}
        </SummaryBoxHeading>
        <SummaryBoxContent>
          {t.rich("unassociatedApplicationAlert.body", {
            link: (content) => (
              <InlineActionLink
                onClick={() => {
                  setIsTransferModalOpen(true);
                }}
              >
                {content}
              </InlineActionLink>
            ),
          })}
        </SummaryBoxContent>
      </SummaryBox>
    );
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
            {applicationDetails.application_status !==
              ApplicationStatus.SUBMITTED &&
              applicationDetails.application_status !==
                ApplicationStatus.ACCEPTED && (
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
              canTransferOwnership={canTransferOwnership}
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

        {isTransferModalOpen ? (
          <TransferOwnershipModal
            applicationId={applicationDetails.application_id}
            modalId={transferModalId}
            modalRef={transferModalRef}
            onAfterClose={handleTransferModalAfterClose}
          />
        ) : null}

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
              disabled={shouldBlockSubmitForTransferOwnership}
            />
          )}
          <ApplicationSubmissionDownload />
        </Grid>
      </>
    );
  };

  return (
    <>
      {shouldBlockSubmitForTransferOwnership ? (
        <NeedsTransferOwnershipCta />
      ) : null}
      <GridContainer
        data-testid="information-card"
        className="border radius-md border-base-lighter padding-x-2 margin-y-4"
      >
        <Grid row gap>
          <InformationCardDetails
            applicationSubmitHandler={applicationSubmitHandler}
          />
        </Grid>
      </GridContainer>
    </>
  );
};

export const SubmitApplicationButton = ({
  buttonText,
  loading,
  submitHandler,
  disabled,
}: {
  buttonText: string;
  loading: boolean;
  submitHandler: () => void;
  disabled?: boolean;
}) => {
  return (
    <Button
      type="button"
      disabled={Boolean(loading) || Boolean(disabled)}
      onClick={submitHandler}
    >
      <USWDSIcon name="upload_file" />
      {loading ? "Loading...  " : buttonText}
    </Button>
  );
};
