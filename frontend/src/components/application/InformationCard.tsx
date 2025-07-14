"use client";

import { ApplicationDetail, Status } from "src/types/applicationResponseTypes";
import { Competition } from "src/types/competitionsResponseTypes";

import { useTranslations } from "next-intl";
import { Button, Grid, GridContainer, Link } from "@trussworks/react-uswds";

import { EditAppFilingName } from "src/components/application/editAppFilingName/EditAppFilingName";
import { USWDSIcon } from "src/components/USWDSIcon";

type CompetitionDetails = { competition: Competition };

export type ApplicationDetailsCardProps = ApplicationDetail &
  CompetitionDetails;

export const InformationCard = ({
  applicationDetails,
  applicationSubmitHandler,
  applicationSubmitted,
  opportunityName,
  submissionLoading,
}: {
  applicationDetails: ApplicationDetailsCardProps;
  applicationSubmitHandler: () => void;
  applicationSubmitted: boolean;
  opportunityName: string | null;
  submissionLoading: boolean;
}) => {
  const t = useTranslations("Application.information");
  const hasOrganization = Boolean(applicationDetails.organization);

  // TODO: check this after mvp
  // instructions were to use the first available path
  // this may change
  const instructionsDownloadPath = applicationDetails.competition
    .competition_instructions.length
    ? applicationDetails.competition.competition_instructions[0].download_path
    : undefined;

  const ApplicantDetails = () => {
    if (hasOrganization) {
      const { legal_business_name, uei, expiration_date } =
        applicationDetails.organization.sam_gov_entity;

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
    }

    return (
      <div className="margin-bottom-1">
        <dt className="margin-right-1 text-bold">{t("applicant")}: </dt>
        <dd>{t("applicantTypeIndividual")}</dd>
      </div>
    );
  };

  const ApplicationInstructionsDownload = () => {
    return (
      <div className="margin-top-4">
        <dt className="usa-sr-only">
          {t("applicationDownloadInstructionsLabel")}:{" "}
        </dt>
        <dd>
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
      <div className="margin-bottom-1">
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
        <dt className="usa-sr-only">{t("specialInstructionsLabel")}: </dt>
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
        {/* 
          TODO: Edit functionality in future task
        */}
        <Grid tablet={{ col: 12 }} mobile={{ col: 12 }}>
          <h3 className="margin-top-2">
            {applicationDetails.application_name}
            <EditAppFilingName
              applicationId={applicationDetails.application_id}
              applicationName={applicationDetails.application_name}
              opportunityName={opportunityName}
            />
          </h3>
        </Grid>
        <Grid tablet={{ col: 6 }} mobile={{ col: 12 }}>
          <dl>
            <ApplicantDetails />
            {applicationDetails.competition.competition_instructions.length ? (
              <ApplicationInstructionsDownload />
            ) : (
              <NoApplicationInstructionsDownload />
            )}
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
                (12:00am ET)
              </dd>
            </div>
            {!applicationDetails.competition.is_open ? (
              <SpecialInstructions />
            ) : null}
            <div className="margin-bottom-1">
              <dt className="margin-right-1 text-bold">{t("statusLabel")}: </dt>
              <dd className="margin-right-1 text-bold text-orange">
                {applicationStatus()}
              </dd>
            </div>
            {!applicationSubmitted && (
              <SubmitApplicationButton
                buttonText={t("submit")}
                submitHandler={applicationSubmitHandler}
                loading={submissionLoading}
              />
            )}
          </dl>
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
