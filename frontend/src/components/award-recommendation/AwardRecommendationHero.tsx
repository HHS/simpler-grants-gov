import { getAwardRecommendationDetails } from "src/services/fetch/fetchers/awardRecommendationFetcher";

import { useTranslations } from "next-intl";
import { Button, Grid, GridContainer } from "@trussworks/react-uswds";

import Breadcrumbs from "src/components/Breadcrumbs";
import AwardRecommendationStatusTag from "./AwardRecommendationStatusTag";

export default async function AwardRecommendationHero() {
  const t = useTranslations("AwardRecommendation");
  const { recordNumber, datePrepared, status } =
    await getAwardRecommendationDetails();

  return (
    <div className="text-dark bg-base-lightest padding-y-4 tablet:padding-y-6">
      <GridContainer>
        <Grid>
          <Breadcrumbs
            className="padding-y-0 bg-transparent"
            breadcrumbList={[
              {
                title: t("awardRecommendation", { defaultValue: "Award Recommendation" }),
                path: "/",
              },
              {
                title: `${t("heroTitle", { defaultValue: "Award Rec #" })}: ${recordNumber}`,
                // TODO: add link to opportunity
                path: `/`,
              },
            ]}
          />
          <Grid className="padding-y-2 tablet:padding-y-3">
            <h1>
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
              <Grid className="padding-top-1 tablet:padding-top-2 display-flex flex-align-center">
                <strong>{t("status", { defaultValue: "Status" })}:</strong>{" "}
                <span className="margin-left-1 display-inline-flex flex-align-center">
                  <AwardRecommendationStatusTag status={status} />
                </span>
              </Grid>
            </Grid>
            <Grid tablet={{ col: "auto" }} className="flex-align-self-end">
              {/* TODO: add save functionality when endpoint is available */}
              <Button type="button" outline className="margin-top-2">
                {t("heroButtons.save")}
              </Button>
              {/* TODO: add create functionality when endpoint is available */}
              <Button type="button" className="margin-top-1">
                {t("heroButtons.create")}
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </GridContainer>
    </div>
  );
}
