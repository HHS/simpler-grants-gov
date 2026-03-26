"use client";

import { AwardRecommendationSummary } from "src/types/awardRecommendationTypes";
import { formatCurrency } from "src/utils/formatCurrencyUtil";

import { useTranslations } from "next-intl";
import { Grid } from "@trussworks/react-uswds";

import { SummaryDescriptionDisplay } from "src/components/opportunity/OpportunityDescription";

type ViewRecommendationSummarySectionProps = {
  summary?: AwardRecommendationSummary;
  fundingStrategy?: string;
  totalAvailable?: number;
};

export const ViewRecommendationSummarySection = ({
  summary,
  fundingStrategy,
  totalAvailable = 250000,
}: ViewRecommendationSummarySectionProps) => {
  const t = useTranslations("AwardRecommendation");

  return (
    <div>
      <Grid row className="grid-gap">
        <Grid col={9} tablet={{ col: 9 }}>
          <div className="margin-top-5 margin-bottom-5">
            <div className="margin-bottom-3">
              <h2 className="margin-top-0 margin-bottom-0">
                {t("recommendations.heading")}
              </h2>
            </div>
            <p className="text-base margin-top-2 margin-bottom-4">
              {t("recommendations.description")}
            </p>

            {summary && (
              <>
                <div className="margin-bottom-4">
                  <h3 className="margin-top-0 margin-bottom-3 font-sans-md">
                    {t("recommendations.summary.heading")}
                  </h3>
                  <div className="border radius-md border-base-lighter padding-3 bg-white">
                    <Grid row gap className="margin-bottom-2">
                      <Grid col={12} tablet={{ col: 4 }}>
                        <div>
                          <p className="text-bold margin-bottom-1">
                            {t("recommendations.summary.appsReceived")}
                          </p>
                          <p className="font-sans-xl text-normal margin-top-0">
                            {summary.total_received_count}
                          </p>
                        </div>
                      </Grid>
                      <Grid col={12} tablet={{ col: 4 }}>
                        <div>
                          <p className="text-bold margin-bottom-1">
                            {t("recommendations.summary.appsRecommended")}
                          </p>
                          <p className="font-sans-xl text-normal margin-top-0">
                            {summary.recommended_for_funding_count}
                          </p>
                        </div>
                      </Grid>
                      <Grid col={12} tablet={{ col: 4 }}>
                        <div>
                          <p className="text-bold margin-bottom-1">
                            {t(
                              "recommendations.summary.totalFundingRecommended",
                            )}
                          </p>
                          <p className="font-sans-xl text-normal margin-top-0">
                            {formatCurrency(summary.total_recommended_amount)}
                          </p>
                        </div>
                      </Grid>
                    </Grid>
                    <Grid row gap>
                      <Grid col={12} tablet={{ col: "fill" }}>
                        <div>
                          <p className="text-bold margin-bottom-1">
                            {t("recommendations.summary.totalAvailable")}
                          </p>
                          <p className="font-sans-md text-normal margin-top-0">
                            {formatCurrency(totalAvailable)}
                          </p>
                        </div>
                      </Grid>
                      <Grid col={12} tablet={{ col: "fill" }}>
                        <div>
                          <p className="text-bold margin-bottom-1 text-no-wrap">
                            {t(
                              "recommendations.summary.recommendedWithoutFunding",
                            )}
                          </p>
                          <p className="font-sans-md text-normal margin-top-0">
                            {summary.recommended_without_funding_count}{" "}
                            {t("recommendations.summary.applications")}
                          </p>
                        </div>
                      </Grid>
                      <Grid col={12} tablet={{ col: "fill" }}>
                        <div>
                          <p className="text-bold margin-bottom-1 text-no-wrap">
                            {t(
                              "recommendations.summary.notRecommendedForFunding",
                            )}
                          </p>
                          <p className="font-sans-md text-normal margin-top-0">
                            {summary.not_recommended_count}{" "}
                            {t("recommendations.summary.applications")}
                          </p>
                        </div>
                      </Grid>
                    </Grid>
                  </div>
                </div>

                {fundingStrategy && (
                  <div className="margin-bottom-4">
                    <div className="border radius-md border-base-lighter padding-3 bg-white">
                      <h3 className="margin-top-0 margin-bottom-2 font-sans-md">
                        {t("recommendations.fundingStrategy.heading")}
                      </h3>
                      <SummaryDescriptionDisplay
                        summaryDescription={fundingStrategy}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </Grid>
      </Grid>
    </div>
  );
};
