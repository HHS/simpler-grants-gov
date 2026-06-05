import { Metadata } from "next";
import { CreateRecommendationContent } from "src/app/[locale]/(base)/award-recommendation/create/_components/CreateRecommendationContent";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { WithFeatureFlagProps } from "src/types/uiTypes";

import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { GridContainer } from "@trussworks/react-uswds";

import Breadcrumbs from "src/components/core/Breadcrumbs";

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

  const t = await getTranslations("CreateAwardRecommendation");

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
            {t("pageTitle")}
          </h1>
        </GridContainer>
      </div>

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
