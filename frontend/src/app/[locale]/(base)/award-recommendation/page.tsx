import { Metadata } from "next";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { LocalizedPageProps } from "src/types/intl";
import { WithFeatureFlagProps } from "src/types/uiTypes";

import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { JSX } from "react";
import { GridContainer } from "@trussworks/react-uswds";

export async function generateMetadata({ params }: LocalizedPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("AwardRecommendation.pageTitle", {
      defaultValue: "Award Recommendation",
    }),
    description: t("AwardRecommendation.metaDescription", {
      defaultValue: "View your award recommendations",
    }),
  };
  return meta;
}

export const dynamic = "force-dynamic";

type AwardRecommendationPageProps = LocalizedPageProps & WithFeatureFlagProps;

const FallbackPage = () => {
  redirect("/maintenance");
};

async function AwardRecommendationPageContent({
  params,
}: AwardRecommendationPageProps) {
  const resolvedParams = await params;
  // eslint-disable-next-line no-console
  console.log("AwardRecommendationPage params:", resolvedParams);
  const t = await getTranslations("AwardRecommendation");

  return (
    <GridContainer>
      <h1 className="margin-top-9 margin-bottom-7">
        {t("pageTitle", { defaultValue: "Award Recommendation" })}
      </h1>
      <p>
        {t("description", {
          defaultValue: "Award Recommendation flow coming soon.",
        })}
      </p>
    </GridContainer>
  );
}

export default withFeatureFlag<AwardRecommendationPageProps, JSX.Element>(
  FallbackPage,
  "awardRecommendationOn",
  (props) => <AwardRecommendationPageContent {...props} />,
);
