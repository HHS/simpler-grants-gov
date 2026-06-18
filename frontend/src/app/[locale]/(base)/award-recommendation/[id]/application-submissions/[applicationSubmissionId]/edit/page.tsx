import { Metadata } from "next";
import { saveAwardRecommendationSubmissionDetails } from "src/app/[locale]/(base)/award-recommendation/[id]/actions";
import AwardRecommendationSubmissionEditHero from "src/app/[locale]/(base)/award-recommendation/[id]/application-submissions/[applicationSubmissionId]/edit/_components/AwardRecommendationSubmissionEditHero";
import { RecommendationDetailsSection } from "src/app/[locale]/(base)/award-recommendation/[id]/application-submissions/[applicationSubmissionId]/edit/_components/RecommendationDetailsSection";
import { ApiRequestError, parseErrorStatus } from "src/errors";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import {
  getAwardRecommendationDetails,
  getAwardRecommendationSubmission,
} from "src/services/fetch/fetchers/awardRecommendationFetcher";
import { AwardRecommendationSubmission } from "src/types/awardRecommendationTypes";
import { WithFeatureFlagProps } from "src/types/uiTypes";

import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Alert, GridContainer } from "@trussworks/react-uswds";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("AwardRecommendation.pageTitleEditApplicationSubmissionDetails"),
    description: t("AwardRecommendation.metaDescriptionEdit"),
  };
  return meta;
}

export const dynamic = "force-dynamic";

export type AwardRecommendationSubmissionEditPageProps = {
  params: Promise<{
    locale: string;
    id: string;
    applicationSubmissionId: string;
  }>;
} & WithFeatureFlagProps;

async function AwardRecommendationSubmissionEditPageContent({
  params,
}: AwardRecommendationSubmissionEditPageProps) {
  const { id: awardRecommendationId, applicationSubmissionId } = await params;
  const t = await getTranslations("AwardRecommendation");

  let submission: AwardRecommendationSubmission | null = null;
  let awardRecommendationNumber = awardRecommendationId;

  try {
    const [awardRecommendationDetails, submissionDetails] = await Promise.all([
      getAwardRecommendationDetails(awardRecommendationId),
      getAwardRecommendationSubmission(
        awardRecommendationId,
        applicationSubmissionId,
      ),
    ]);

    awardRecommendationNumber =
      awardRecommendationDetails.award_recommendation_number;
    submission = submissionDetails;
  } catch (error) {
    console.error(
      "Failed to fetch award recommendation submission details",
      error,
    );
    const errorStatus = parseErrorStatus(error as ApiRequestError);

    if (errorStatus === 401 || errorStatus === 403) {
      return (
        <Alert
          heading={t("errorHeadingAuthentication")}
          headingLevel="h2"
          type="error"
          validation
        >
          {t("authenticationError")}
        </Alert>
      );
    }

    return (
      <Alert
        heading={t("errorHeadingAwardRecommendationSubmission")}
        headingLevel="h2"
        type="warning"
        validation
      >
        {t("awardRecommendationSubmissionFetchError")}
      </Alert>
    );
  }

  if (!submission) {
    return (
      <Alert
        heading={t("errorHeadingAwardRecommendationSubmission")}
        headingLevel="h2"
        type="warning"
        validation
      >
        {t("awardRecommendationSubmissionFetchError")}
      </Alert>
    );
  }

  const applicationSubmission = submission.application_submission;
  const applicationSubmissionNumber =
    applicationSubmission.application_submission_number || "";
  const applicationId = applicationSubmission.application?.application_id ?? "";

  return (
    <form action={saveAwardRecommendationSubmissionDetails}>
      <AwardRecommendationSubmissionEditHero
        awardRecommendationId={awardRecommendationId}
        awardRecommendationBreadcrumbTitle={`${t("heroTitle")}: ${awardRecommendationNumber}`}
        applicationSubmissionNumber={applicationSubmissionNumber}
        applicationId={applicationId}
        awardRecsLabel={t("awardRecs")}
        editTitle={t("submissionEdit.editTitle", {
          applicationSubmissionNumber,
        })}
        viewOriginalApplicationLabel={t(
          "submissionEdit.viewOriginalApplication",
        )}
        cancelLabel={t("heroButtons.cancel")}
        saveLabel={t("heroButtons.save")}
      />
      <GridContainer>
        <input
          type="hidden"
          name="award_recommendation_id"
          value={awardRecommendationId}
        />
        <input
          type="hidden"
          name="award_recommendation_application_submission_id"
          value={submission.award_recommendation_application_submission_id}
        />
        <RecommendationDetailsSection submission={submission} />
      </GridContainer>
    </form>
  );
}

export default withFeatureFlag<
  AwardRecommendationSubmissionEditPageProps,
  never
>(AwardRecommendationSubmissionEditPageContent, "awardRecommendationOff", () =>
  redirect("/maintenance"),
);
