import { useTranslations } from "next-intl";
import { Button, Grid, GridContainer } from "@trussworks/react-uswds";

export default function AwardRecommendationHero() {
  const t = useTranslations("AwardRecommendation");

  return (
    <div className="text-dark bg-base-lightest tablet:padding-y-6">
      <GridContainer>
        <Grid>
          <Grid>~~~breadcrumbs~~~</Grid>
          <Grid className="tablet:padding-y-3">
            <h1>
              {t("heroTitle", { defaultValue: "Award Recommendation" })}:
              AR-XX-XXXX
            </h1>
          </Grid>
          <Grid row gap>
            <Grid tablet={{ col: "fill" }}>
              <Grid>
                <strong>
                  {t("datePrepared", { defaultValue: "Date Prepared" })}:
                </strong>{" "}
                01/08/2026
              </Grid>
              <Grid className="tablet:padding-top-2">
                <strong>{t("status", { defaultValue: "Status" })}:</strong>{" "}
                Draft
              </Grid>
            </Grid>
            <Grid tablet={{ col: "auto" }} className="flex-align-self-end">
              <Button type="button" outline>
                {t("heroButtons.save")}
              </Button>
              <Button type="button">{t("heroButtons.create")}</Button>
            </Grid>
          </Grid>
        </Grid>
      </GridContainer>
    </div>
  );
}
