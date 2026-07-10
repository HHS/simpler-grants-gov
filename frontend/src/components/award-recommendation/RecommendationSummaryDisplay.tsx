"use client";

import { AwardRecommendationSummary } from "src/types/awardRecommendationTypes";
import { formatCurrency } from "src/utils/formatCurrencyUtil";

import { useTranslations } from "next-intl";
import { Grid } from "@trussworks/react-uswds";

type RecommendationSummaryDisplayProps = {
  summary?: AwardRecommendationSummary;
  totalAvailable?: number;
};

export const RecommendationSummaryDisplay = ({
  summary,
  totalAvailable = 250000,
}: RecommendationSummaryDisplayProps) => {
  const t = useTranslations("AwardRecommendation.recommendations");

  return (
    <div className="margin-bottom-4">
      <h3 className="margin-top-0 margin-bottom-3 font-sans-md">
        {t("summary.heading")}
      </h3>
      <div className="border radius-md border-base-lighter padding-3 bg-white">
        <Grid row gap className="margin-bottom-2">
          <Grid col={12} tablet={{ col: 4 }}>
            <div>
              <p className="text-bold margin-bottom-1">
                {t("summary.appsReceived")}
              </p>
              <p className="font-sans-xl text-normal margin-top-0">
                {summary?.total_received_count ?? 0}
              </p>
            </div>
          </Grid>
          <Grid col={12} tablet={{ col: 4 }}>
            <div>
              <p className="text-bold margin-bottom-1">
                {t("summary.appsRecommended")}
              </p>
              <p className="font-sans-xl text-normal margin-top-0">
                {summary?.recommended_for_funding_count ?? 0}
              </p>
            </div>
          </Grid>
          <Grid col={12} tablet={{ col: 4 }}>
            <div>
              <p className="text-bold margin-bottom-1">
                {t("summary.totalFundingRecommended")}
              </p>
              <p className="font-sans-xl text-normal margin-top-0">
                {formatCurrency(summary?.total_recommended_amount ?? 0)}
              </p>
            </div>
          </Grid>
        </Grid>
        <Grid row gap>
          <Grid col={12} tablet={{ col: "fill" }}>
            <div>
              <p className="text-bold margin-bottom-1">
                {t("summary.totalAvailable")}
              </p>
              <p className="font-sans-md text-normal margin-top-0">
                {formatCurrency(totalAvailable)}
              </p>
            </div>
          </Grid>
          <Grid col={12} tablet={{ col: "fill" }}>
            <div>
              <p className="text-bold margin-bottom-1">
                {t("summary.recommendedWithoutFunding")}
              </p>
              <p className="font-sans-md text-normal margin-top-0">
                {summary?.recommended_without_funding_count ?? 0}{" "}
                {t("summary.applications")}
              </p>
            </div>
          </Grid>
          <Grid col={12} tablet={{ col: "fill" }}>
            <div>
              <p className="text-bold margin-bottom-1">
                {t("summary.notRecommendedForFunding")}
              </p>
              <p className="font-sans-md text-normal margin-top-0">
                {summary?.not_recommended_count ?? 0}{" "}
                {t("summary.applications")}
              </p>
            </div>
          </Grid>
        </Grid>
      </div>
    </div>
  );
};
