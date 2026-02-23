import { useTranslations } from "next-intl";
import { Button, Grid, GridContainer } from "@trussworks/react-uswds";

import AwardRecommendationStatusTag, {
  type AwardRecommendationStatus,
} from "./AwardRecommendationStatusTag";

type Props = {
  status?: AwardRecommendationStatus;
};

export default function AwardRecommendationHero({ status = "draft" }: Props) {
  const t = useTranslations("AwardRecommendation");

  return (
    <div className="text-dark bg-base-lightest padding-y-4 tablet:padding-y-6">
      <GridContainer>
        <Grid>
          <Grid>~~~breadcrumbs~~~</Grid>
          <Grid className="padding-y-2 tablet:padding-y-3">
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
                </strong>
                <span className="margin-left-1 display-inline-flex flex-align-center">
                  01/08/2026
                </span>
              </Grid>
              <Grid className="padding-top-1 tablet:padding-top-2 display-flex flex-align-center">
                <strong>{t("status", { defaultValue: "Status" })}:</strong>
                <span className="margin-left-1 display-inline-flex flex-align-center">
                  <AwardRecommendationStatusTag status={status} />
                </span>
              </Grid>
            </Grid>
            <Grid tablet={{ col: "auto" }} className="flex-align-self-end">
              <Button type="button" outline className="margin-top-2">
                {t("heroButtons.save")}
              </Button>
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
