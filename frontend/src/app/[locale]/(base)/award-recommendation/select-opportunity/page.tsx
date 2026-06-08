import { Metadata } from "next";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { WithFeatureFlagProps } from "src/types/uiTypes";

import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { GridContainer } from "@trussworks/react-uswds";

import { SelectFundingOpportunityContent } from "src/app/[locale]/(base)/award-recommendation/select-opportunity/_components/SelectFundingOpportunityContent";
import CreateAwardRecommendationHeroContent from "src/components/award-recommendation/CreateAwardRecommendationHero";


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

  return (
    <>
      <CreateAwardRecommendationHeroContent />

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
