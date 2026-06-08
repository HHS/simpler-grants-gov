import { Metadata } from "next";
import { CreateRecommendationContent } from "src/app/[locale]/(base)/award-recommendation/create/_components/CreateRecommendationContent";
import CreateAwardRecommendationHeroContent from "src/components/award-recommendation/CreateAwardRecommendationHero";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { WithFeatureFlagProps } from "src/types/uiTypes";

import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { GridContainer } from "@trussworks/react-uswds";


export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("CreateAwardRecommendation.pageTitle"),
    description: t("CreateAwardRecommendation.metaDescription"),
  };
  return meta;
}

export type CreateAwardRecommendationPageProps = {
  params: Promise<{ locale: string }>;
} & WithFeatureFlagProps;

async function CreateAwardRecommendationPageContent({
  params,
}: CreateAwardRecommendationPageProps) {
  await params;

  return (
    <>
      <CreateAwardRecommendationHeroContent />

      <GridContainer>
        <CreateRecommendationContent />
      </GridContainer>
    </>
  );
}

export default withFeatureFlag<CreateAwardRecommendationPageProps, never>(
  CreateAwardRecommendationPageContent,
  "awardRecommendationOff",
  () => redirect("/maintenance"),
);
