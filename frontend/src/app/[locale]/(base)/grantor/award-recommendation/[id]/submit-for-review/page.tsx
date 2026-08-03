import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Grid } from "@trussworks/react-uswds";

import { getAwardRecommendationDetails } from "src/services/fetch/fetchers/awardRecommendationFetcher";
import { AwardRecommendationDetails } from "src/types/awardRecommendationTypes";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { WithFeatureFlagProps } from "src/types/uiTypes";
import AwardRecommendationHero from "src/components/award-recommendation/AwardRecommendationHero";
import { ReviewSubmissionFormContainer } from "src/app/[locale]/(base)/grantor/award-recommendation/[id]/submit-for-review/_components/ReviewSubmissionFormContainer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("AwardRecommendation.reviewForm.pageTitle"),
    description: t("AwardRecommendation.reviewForm.pageDescription"),
  };
  return meta;
}

export const dynamic = "force-dynamic";

export type SubmitForReviewPageProps = {
  params: Promise<{ locale: string; id: string }>;
} & WithFeatureFlagProps;

async function SubmitForReviewPageContent({ params }: SubmitForReviewPageProps) {
  const { id: awardRecommendationId } = await params;
  const t = await getTranslations("AwardRecommendation");

  let awardRecommendationDetails: AwardRecommendationDetails | null = null;
  try {
    awardRecommendationDetails = await getAwardRecommendationDetails(
      awardRecommendationId,
    );
  } catch (error) {
    console.error("Failed to fetch award recommendation details", error);
    redirect(`/grantor/award-recommendation/${awardRecommendationId}/edit`);
  }

  if (!awardRecommendationDetails) {
    redirect(`/grantor/award-recommendation/${awardRecommendationId}/edit`);
  }

  return (
    <>
      <AwardRecommendationHero
        awardRecommendationDetails={awardRecommendationDetails}
        buttons={[]}
        heading={t("reviewForm.header")}
        showDateAndStatus={false}
        additionalBreadcrumbs={[
          {
            title: t("reviewForm.header"),
          },
        ]}
      />
      <div className="grid-container margin-top-4">
        <Grid row>
          <Grid col={12}>
            <ReviewSubmissionFormContainer
              awardRecommendationId={awardRecommendationId}
              reviewWorkflowId={awardRecommendationDetails.review_workflow_id}
            />
          </Grid>
        </Grid>
      </div>
    </>
  );
}

export default withFeatureFlag<SubmitForReviewPageProps, never>(
  SubmitForReviewPageContent,
  "awardRecommendationOff",
  () => redirect("/maintenance"),
);
