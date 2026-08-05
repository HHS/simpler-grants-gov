import { Metadata } from "next";
import { saveAwardRecommendationSubmissionDetails } from "src/app/[locale]/(base)/grantor/award-recommendation/[id]/actions";
import RecommendationSubmissionEditForm from "src/app/[locale]/(base)/grantor/award-recommendation/[id]/application-submissions/[applicationSubmissionId]/edit/_components/RecommendationSubmissionEditForm";
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
import { Suspense } from "react";
import { Alert } from "@trussworks/react-uswds";

import AwardRecommendationHero from "src/components/award-recommendation/AwardRecommendationHero";

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

  const editPageHref = `/grantor/award-recommendation/${awardRecommendationId}/edit`;
  const editTitle = t("submissionEdit.editTitle", {
    applicationSubmissionNumber,
  });

  const heroButtons = [
    {
      type: "navigation" as const,
      label: t("heroButtons.cancel"),
      href: editPageHref,
      outline: true,
    },
    {
      type: "action" as const,
      label: t("heroButtons.save"),
      formAction: saveAwardRecommendationSubmissionDetails,
    },
  ];

  const externalLink = {
    label: t("submissionEdit.viewOriginalApplication"),
    sublabel: applicationSubmissionNumber,
    href: `/workspace/applications/${applicationId}`,
  };

  return (
    <RecommendationSubmissionEditForm
      action={saveAwardRecommendationSubmissionDetails}
      awardRecommendationId={awardRecommendationId}
      applicationSubmissionId={applicationSubmissionId}
      submission={submission}
      hero={
        <Suspense
          fallback={
            <span data-testid="award-recommendation-hero-fallback"></span>
          }
        >
          <AwardRecommendationHero
            heading={editTitle}
            showDateAndStatus={false}
            buttons={heroButtons}
            externalLink={externalLink}
            additionalBreadcrumbs={[
              {
                title: t("awardRecs"),
                path: "/",
              },
              {
                title: `${t("heroTitle")}: ${awardRecommendationNumber}`,
                path: editPageHref,
              },
              {
                title: editTitle,
              },
            ]}
          />
        </Suspense>
      }
    />
  );
}

export default withFeatureFlag<
  AwardRecommendationSubmissionEditPageProps,
  never
>(AwardRecommendationSubmissionEditPageContent, "awardRecommendationOff", () =>
  redirect("/maintenance"),
);
