"use client";

import { useTranslations } from "next-intl";
import { Grid } from "@trussworks/react-uswds";

export const SelectFundingOpportunityContent = () => {
  const t = useTranslations("AwardRecommendationSelectFundingOpportunity");

  return (
    <Grid row className="grid-gap">
      <Grid col={9} tablet={{ col: 9 }}>
        <div className="margin-top-5 margin-bottom-5">
          <h2 className="margin-top-0 margin-bottom-2 font-sans-xl text-bold">
            {t("whichFundingOpportunity")}
          </h2>
        </div>
      </Grid>
    </Grid>
  );
};
