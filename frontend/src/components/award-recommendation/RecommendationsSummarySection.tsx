"use client";

import { AwardRecommendationSummary } from "src/types/awardRecommendationTypes";

import { useTranslations } from "next-intl";
import { CharacterCount, Grid } from "@trussworks/react-uswds";

import { SummaryDescriptionDisplay } from "src/components/opportunity/OpportunityDescription";

interface RecommendationsSummarySectionProps {
  mode?: "view" | "edit";
  summary?: AwardRecommendationSummary;
  fundingStrategy?: string;
  totalAvailable?: number;
}

export const RecommendationsSummarySection = ({
  mode = "view",
  summary,
  fundingStrategy,
  totalAvailable = 250000,
}: RecommendationsSummarySectionProps) => {
  const t = useTranslations("AwardRecommendation");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div>
      <Grid row className="grid-gap">
        <Grid col={9} tablet={{ col: 9 }}>
          <div className="margin-top-5 margin-bottom-5">
            <div className="margin-bottom-3">
              <h2 className="margin-top-0 margin-bottom-0">
                {t("recommendations.heading", {
                  defaultValue: "Recommendations",
                })}
              </h2>
            </div>
            <p className="text-base margin-top-2 margin-bottom-4">
              {t("recommendations.description", {
                defaultValue:
                  "Award recommendations and the funding strategy used for the period of performance.",
              })}
            </p>

            {(summary || mode === "edit") && (
              <>
                <div className="margin-bottom-4">
                  <h3 className="margin-top-0 margin-bottom-3 font-sans-md">
                    {t("recommendations.summary.heading", {
                      defaultValue: "Summary",
                    })}
                  </h3>
                  <div className="border radius-md border-base-lighter padding-3 bg-white">
                    <Grid row gap className="margin-bottom-2">
                      <Grid col={4}>
                        <div>
                          <p className="text-bold margin-bottom-1">
                            {t("recommendations.summary.appsReceived", {
                              defaultValue: "Apps received",
                            })}
                          </p>
                          <p className="font-sans-xl text-normal margin-top-0">
                            {summary?.total_received_count ?? 0}
                          </p>
                        </div>
                      </Grid>
                      <Grid col={4}>
                        <div>
                          <p className="text-bold margin-bottom-1">
                            {t("recommendations.summary.appsRecommended", {
                              defaultValue: "Apps recommended",
                            })}
                          </p>
                          <p className="font-sans-xl text-normal margin-top-0">
                            {summary?.recommended_for_funding_count ?? 0}
                          </p>
                        </div>
                      </Grid>
                      <Grid col={4}>
                        <div>
                          <p className="text-bold margin-bottom-1">
                            {t(
                              "recommendations.summary.totalFundingRecommended",
                              {
                                defaultValue: "Total funding recommended",
                              },
                            )}
                          </p>
                          <p className="font-sans-xl text-normal margin-top-0">
                            {formatCurrency(
                              summary?.total_recommended_amount ?? 0,
                            )}
                          </p>
                        </div>
                      </Grid>
                    </Grid>
                    <Grid row gap>
                      <Grid col="fill">
                        <div>
                          <p className="text-bold margin-bottom-1">
                            {t("recommendations.summary.totalAvailable", {
                              defaultValue: "Total available",
                            })}
                          </p>
                          <p className="font-sans-md text-normal margin-top-0">
                            {formatCurrency(totalAvailable)}
                          </p>
                        </div>
                      </Grid>
                      <Grid col="fill">
                        <div>
                          <p className="text-bold margin-bottom-1 text-no-wrap">
                            {t(
                              "recommendations.summary.recommendedWithoutFunding",
                              {
                                defaultValue: "Recommended without funding",
                              },
                            )}
                          </p>
                          <p className="font-sans-md text-normal margin-top-0">
                            {summary?.recommended_without_funding_count ?? 0}{" "}
                            {t("recommendations.summary.applications", {
                              defaultValue: "applications",
                            })}
                          </p>
                        </div>
                      </Grid>
                      <Grid col="fill">
                        <div>
                          <p className="text-bold margin-bottom-1 text-no-wrap">
                            {t(
                              "recommendations.summary.notRecommendedForFunding",
                              {
                                defaultValue: "Not recommended for funding",
                              },
                            )}
                          </p>
                          <p className="font-sans-md text-normal margin-top-0">
                            {summary?.not_recommended_count ?? 0}{" "}
                            {t("recommendations.summary.applications", {
                              defaultValue: "applications",
                            })}
                          </p>
                        </div>
                      </Grid>
                    </Grid>
                  </div>
                </div>

                <div className="margin-bottom-4">
                  <div className="border radius-md border-base-lighter padding-3 bg-white">
                    <h3 className="margin-top-0 margin-bottom-2 font-sans-md">
                      {t("recommendations.fundingStrategy.heading", {
                        defaultValue: "Funding strategy",
                      })}
                    </h3>
                    {mode === "edit" ? (
                      <>
                        <p className="text-base-dark margin-top-0 margin-bottom-2">
                          {t("recommendations.fundingStrategy.description", {
                            defaultValue:
                              "Explain how you plan to provide funding over time. For example, will the agency award all funding in a single award or in multiple budget periods across a longer period of performance.",
                          })}
                        </p>
                        <CharacterCount
                          id="funding_strategy"
                          name="funding_strategy"
                          maxLength={1000}
                          defaultValue={fundingStrategy || ""}
                          isTextArea
                          data-testid="funding-strategy-textarea"
                        />
                      </>
                    ) : (
                      fundingStrategy && (
                        <SummaryDescriptionDisplay
                          summaryDescription={fundingStrategy || ""}
                        />
                      )
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </Grid>
      </Grid>
    </div>
  );
};
