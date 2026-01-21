"use client";

import {
  ApplicationDetail,
  SamGovEntity,
  Status,
} from "src/types/applicationResponseTypes";
import { Competition } from "src/types/competitionsResponseTypes";

import { useTranslations } from "next-intl";
import { Button, Grid, GridContainer, Link } from "@trussworks/react-uswds";

import { EditAppFilingName } from "src/components/application/editAppFilingName/EditAppFilingName";
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
  applicationId,
}: {
  hasOrganization: boolean;
  samGovEntity?: SamGovEntity;
  applicationId: string;
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
        <TransferOwnershipButton applicationId={applicationId} />
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
}: {
  applicationDetails: ApplicationDetailsCardProps;
  applicationSubmitHandler: () => void;
  applicationSubmitted: boolean;
  opportunityName: string | null;
  submissionLoading: boolean;
  instructionsDownloadPath: string;
}) => {
  const t = useTranslations("Application.information");
  const hasOrganization = Boolean(applicationDetails.organization);
  const { is_open } = applicationDetails.competition;

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

  const InformationCardDetails = ({
    applicationSubmitHandler,
  }: {
    applicationSubmitHandler: () => void;
  }) => {
    return (
      <>
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
              applicationId={applicationDetails.application_id}
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

        <Grid tablet={{ col: 6 }} mobile={{ col: 12 }}>
          {!applicationSubmitted && is_open && (
            <SubmitApplicationButton
              buttonText={t("submit")}
              submitHandler={applicationSubmitHandler}
              loading={submissionLoading}
            />
          )}
        </Grid>
      </>
    );
  };

  return (
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
  );
};

export const SubmitApplicationButton = ({
  buttonText,
  loading,
  submitHandler,
}: {
  buttonText: string;
  loading: boolean;
  submitHandler: () => void;
}) => {
  return (
    <Button type="button" disabled={!!loading} onClick={submitHandler}>
      <USWDSIcon name="upload_file" />
      {loading ? "Loading...  " : buttonText}
    </Button>
  );
};
