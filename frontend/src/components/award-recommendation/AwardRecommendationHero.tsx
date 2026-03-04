import { getAwardRecommendationDetails } from "src/services/fetch/fetchers/awardRecommendationFetcher";

import { getTranslations } from "next-intl/server";
import { Button, Grid, GridContainer } from "@trussworks/react-uswds";

import Breadcrumbs from "src/components/Breadcrumbs";
import AwardRecommendationStatusTag from "./AwardRecommendationStatusTag";

interface AwardRecommendationHeroProps {
  awardRecommendationId: string;
}

export default async function AwardRecommendationHero({
  awardRecommendationId,
}: AwardRecommendationHeroProps) {
  const t = await getTranslations("AwardRecommendation");
  const { recordNumber, datePrepared, status } =
    await getAwardRecommendationDetails(awardRecommendationId);

  return (
    <div
      data-testid="award-recommendation-hero"
      className="text-dark bg-base-lightest padding-bottom-4 tablet:padding-y-6"
    >
      <GridContainer>
        <Grid>
          <Breadcrumbs
            className="padding-y-0 bg-transparent"
            breadcrumbList={[
              {
                title: t("awardRecs", {
                  defaultValue: "Award Recs",
                }),
                // TODO: add link to award recommendations page
                path: "/",
              },
              {
                title: `${t("heroTitle", { defaultValue: "Award Rec #" })}: ${recordNumber}`,
                path: `/`,
              },
            ]}
          />
          <Grid className="padding-bottom-4 padding-bottom-4 tablet:padding-y-3">
            <h1 className="font-sans-xl tablet:font-sans-2xl">
              {t("heroTitle", { defaultValue: "Award Rec #" })}: {recordNumber}
            </h1>
          </Grid>
          <Grid row gap>
            <Grid tablet={{ col: "fill" }}>
              <Grid>
                <strong>
                  {t("datePrepared", { defaultValue: "Date Prepared" })}:{" "}
                </strong>
                <span className="margin-left-1 display-inline-flex flex-align-center">
                  {datePrepared}
                </span>
              </Grid>
              <Grid className="padding-top-2 tablet:padding-top-2 display-flex flex-align-center">
                <strong>{t("status", { defaultValue: "Status" })}:</strong>{" "}
                <span className="margin-left-1 display-inline-flex flex-align-center">
                  <AwardRecommendationStatusTag status={status} />
                </span>
              </Grid>
            </Grid>
            <Grid className="flex-align-self-end margin-top-4 tablet:margin-top-2 display-flex flex-justify-start">
              {/* TODO: add save functionality when endpoint is available */}
              <Button type="button" outline style={{ width: "auto" }}>
                {t("heroButtons.save")}
              </Button>
              {/* TODO: add create functionality when endpoint is available */}
              <Button type="button" style={{ width: "auto" }}>
                {t("heroButtons.create")}
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </GridContainer>
    </div>
  );
}
