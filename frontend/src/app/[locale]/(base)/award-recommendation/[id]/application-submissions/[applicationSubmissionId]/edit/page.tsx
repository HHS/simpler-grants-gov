import { Metadata } from "next";
import { saveAwardRecommendationSubmissionDetails } from "src/app/[locale]/(base)/award-recommendation/[id]/actions";
import { RecommendationDetailsSection } from "src/app/[locale]/(base)/award-recommendation/[id]/application-submissions/[applicationSubmissionId]/edit/_components/RecommendationDetailsSection";
import { ApiRequestError, parseErrorStatus } from "src/errors";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { getAwardRecommendationSubmission } from "src/services/fetch/fetchers/awardRecommendationFetcher";
import { AwardRecommendationSubmission } from "src/types/awardRecommendationTypes";
import { WithFeatureFlagProps } from "src/types/uiTypes";

import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Alert, Button, Grid, GridContainer } from "@trussworks/react-uswds";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id?: string }>;
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
    id?: string;
    applicationSubmissionId?: string;
  }>;
} & WithFeatureFlagProps;

async function AwardRecommendationSubmissionEditPageContent({
  params,
}: AwardRecommendationSubmissionEditPageProps) {
  const { id: awardRecommendationId, applicationSubmissionId } = await params;
  const t = await getTranslations("AwardRecommendation");

  let submission: AwardRecommendationSubmission | null = null;
  if (awardRecommendationId && applicationSubmissionId) {
    try {
      submission = await getAwardRecommendationSubmission(
        awardRecommendationId,
        applicationSubmissionId,
      );
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

  return (
    <form>
      <GridContainer>
        <RecommendationDetailsSection submission={submission} />
        <Grid row className="grid-gap">
          <Grid col={9} tablet={{ col: 9 }}>
            <Grid className="display-flex flex-justify-start gap-1 margin-top-2 margin-bottom-5">
              <Link
                href={`/award-recommendation/${awardRecommendationId}/edit`}
                className="usa-button usa-button--outline width-auto"
                prefetch={false}
              >
                {t("heroButtons.cancel")}
              </Link>
              <Button
                type="submit"
                formAction={saveAwardRecommendationSubmissionDetails}
                className="width-auto"
              >
                {t("heroButtons.save")}
              </Button>
            </Grid>
          </Grid>
        </Grid>
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
