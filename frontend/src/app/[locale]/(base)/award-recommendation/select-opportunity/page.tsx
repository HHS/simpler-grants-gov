import { Metadata } from "next";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { WithFeatureFlagProps } from "src/types/uiTypes";

import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { GridContainer } from "@trussworks/react-uswds";

import { SelectFundingOpportunityContent } from "src/components/award-recommendation/SelectFundingOpportunityContent";
import Breadcrumbs from "src/components/Breadcrumbs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("AwardRecommendationSelectFundingOpportunity.pageTitle"),
    description: t(
      "AwardRecommendationSelectFundingOpportunity.metaDescription",
    ),
  };
  return meta;
}

export type SelectOpportunityPageProps = {
  params: Promise<{ locale: string }>;
} & WithFeatureFlagProps;

async function SelectOpportunityPageContent({
  params,
}: SelectOpportunityPageProps) {
  await params;

  const t = await getTranslations(
    "AwardRecommendationSelectFundingOpportunity",
  );

  return (
    <>
      <div className="bg-white">
        <GridContainer>
          <Breadcrumbs
            breadcrumbList={[
              { title: "home", path: "/" },
              {
                title: "Award Recommendations",
                path: `/workspace`,
              },
              {
                title: "Create",
                path: `/award-recommendation/create`,
              },
            ]}
          />

          <h1 className="margin-top-4 margin-bottom-4 font-sans-2xl">
            {t("pageHeading")}
          </h1>
        </GridContainer>
      </div>

      <GridContainer>
        <SelectFundingOpportunityContent />
      </GridContainer>
    </>
  );
}

export default withFeatureFlag<SelectOpportunityPageProps, never>(
  SelectOpportunityPageContent,
  "awardRecommendationOff",
  () => redirect("/maintenance"),
);
