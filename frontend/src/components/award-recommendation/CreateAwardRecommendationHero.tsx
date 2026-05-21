import { getTranslations } from "next-intl/server";
import { Grid, GridContainer } from "@trussworks/react-uswds";

import Breadcrumbs from "src/components/Breadcrumbs";

export default async function CreateAwardRecommendationHeroContent() {
  const t = await getTranslations("AwardRecommendation");

  return (
    <div
      data-testid="award-recommendation-hero"
      className="text-dark bg-base-lightest padding-bottom-4 mobile-lg:padding-y-4 tablet:padding-y-6"
    >
      <GridContainer>
        <Grid>
          <Breadcrumbs
            className="padding-y-0 bg-transparent"
            breadcrumbList={[
              {
                title: t("awardRecs"),
                // TODO: add link to award recommendations page
                path: "/",
              },
              {
                title: `${t("heroButtons.create")}`,
                path: ``,
              },
            ]}
          />
          <Grid className="padding-bottom-4 mobile-lg:padding-y-4 tablet:padding-y-3">
            <h1 className="font-sans-xl tablet:font-sans-2xl">
              {t("createHeroTitle")}
            </h1>
          </Grid>
        </Grid>
      </GridContainer>
    </div>
  );
}
