"use client";

import { AwardRecommendationSummary } from "src/types/awardRecommendationTypes";

import { useTranslations } from "next-intl";
import { CharacterCount, Grid } from "@trussworks/react-uswds";

import { RecommendationSummaryDisplay } from "src/components/award-recommendation/RecommendationSummaryDisplay";
import { SummaryDescriptionDisplay } from "src/components/opportunity/OpportunityDescription";

type RecommendationSummarySectionProps = {
  summary?: AwardRecommendationSummary;
  fundingStrategy?: string;
  totalAvailable?: number;
  viewMode?: boolean;
};

export const RecommendationSummarySection = ({
  summary,
  fundingStrategy,
  totalAvailable = 250000,
  viewMode = false,
}: RecommendationSummarySectionProps) => {
  const t = useTranslations("AwardRecommendation.recommendations");

  return (
    <div>
      <Grid row className="grid-gap">
        <Grid col={9} tablet={{ col: 9 }}>
          <div className="margin-top-5 margin-bottom-5">
            <div className="margin-bottom-3">
              <h2 className="margin-top-0 margin-bottom-0">{t("heading")}</h2>
            </div>
            <p className="text-base margin-top-2 margin-bottom-4">
              {viewMode ? t("description") : t("editPageDescription")}
            </p>

            {viewMode && !summary ? null : (
              <>
                <RecommendationSummaryDisplay
                  summary={summary}
                  totalAvailable={totalAvailable}
                />

                {viewMode ? (
                  fundingStrategy && (
                    <div className="margin-bottom-4">
                      <div className="border radius-md border-base-lighter padding-3 bg-white">
                        <h3 className="margin-top-0 margin-bottom-2 font-sans-md">
                          {t("fundingStrategy.heading")}
                        </h3>
                        <SummaryDescriptionDisplay
                          summaryDescription={fundingStrategy}
                        />
                      </div>
                    </div>
                  )
                ) : (
                  <div className="margin-bottom-4">
                    <div className="bg-white">
                      <h3 className="margin-top-0 margin-bottom-2 font-sans-md">
                        {t("fundingStrategy.heading")}
                      </h3>
                      <p className="text-base-dark margin-top-0 margin-bottom-2">
                        {t("fundingStrategy.description")}
                      </p>
                      <CharacterCount
                        id="funding_strategy"
                        name="funding_strategy"
                        maxLength={1000}
                        className="maxw-full"
                        defaultValue={fundingStrategy || ""}
                        isTextArea
                        data-testid="funding-strategy-textarea"
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
