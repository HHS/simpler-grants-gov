"use client";

import { useTranslations } from "next-intl";
import { CharacterCount, Grid, Radio } from "@trussworks/react-uswds";

import { SummaryDescriptionDisplay } from "src/components/opportunity/OpportunityDescription";

interface RecommendationSectionProps {
  mode: "view" | "edit";
  recommendationMethod?: string;
  recommendationMethodDetails?: string;
  otherKeyInformation?: string;
}

export const RecommendationSection = ({
  mode,
  recommendationMethod,
  recommendationMethodDetails,
  otherKeyInformation,
}: RecommendationSectionProps) => {
  const t = useTranslations("AwardRecommendation");

  // Edit mode: form inputs without borders
  if (mode === "edit") {
    return (
      <div>
        <Grid row className="grid-gap">
          <Grid col={9} tablet={{ col: 9 }}>
            <div className="margin-top-3 margin-bottom-3">
              <div>
                <div className="margin-bottom-3">
                  <p className="text-bold margin-bottom-2">
                    {t("recommendationMethod.label", {
                      defaultValue: "Recommendation method",
                    })}
                  </p>
                  <p className="text-base margin-top-1 margin-bottom-2">
                    {t("recommendationMethod.description", {
                      defaultValue: "Choose the method you'll use to rate",
                    })}
                  </p>
                  <Radio
                    id="merit_review_only"
                    name="award_selection_method"
                    label={t("recommendationMethod.meritReviewOnly", {
                      defaultValue: "Merit review ranking only",
                    })}
                    value="merit-review-only"
                  />
                  <Radio
                    id="merit_review_other"
                    name="award_selection_method"
                    label={t("recommendationMethod.meritReviewOther", {
                      defaultValue: "Merit review ranking with other factors",
                    })}
                    value="merit-review-other"
                  />
                </div>
                <div className="margin-bottom-3">
                  <p className="text-bold margin-bottom-2">
                    {t("recommendationMethodDetails.label", {
                      defaultValue: "Recommendation method details",
                    })}
                  </p>
                  <p className="text-base margin-top-1 margin-bottom-2">
                    {t("recommendationMethodDetails.description", {
                      defaultValue:
                        "Add any additional information - including the selection factors used in the NOFO",
                    })}
                  </p>
                  <CharacterCount
                    id="award_selection_details"
                    name="award_selection_details"
                    maxLength={500}
                    isTextArea
                    defaultValue=""
                    rows={6}
                    className="maxw-full"
                    data-testid="award-selection-details-textarea"
                  />
                </div>
                <div className="border-top border-base-lighter margin-top-4 margin-bottom-4" />
                <div className="margin-bottom-3">
                  <p className="text-bold margin-bottom-1 font-sans-sm">
                    {t("otherKeyInformation.label", {
                      defaultValue: "Other key information",
                    })}
                  </p>
                  <p className="text-base margin-top-1 margin-bottom-2">
                    {t("otherKeyInformation.description", {
                      defaultValue:
                        "Add any relevant information related to this reviewer and decision-maker for this opportunity",
                    })}
                  </p>
                  <CharacterCount
                    id="other_key_information"
                    name="other_key_information"
                    maxLength={500}
                    isTextArea
                    defaultValue=""
                    rows={6}
                    className="maxw-full"
                    data-testid="other-key-information-textarea"
                  />
                </div>
              </div>
            </div>
          </Grid>
        </Grid>
      </div>
    );
  }

  // View mode: display data with border
  return (
    <div>
      <Grid row className="grid-gap">
        <Grid col={9} tablet={{ col: 9 }}>
          <div className="margin-top-3 margin-bottom-3">
            <div className="border radius-md border-base-lighter padding-3 bg-white">
              <div className="margin-bottom-3">
                <p className="text-bold margin-bottom-2">
                  {t("recommendationMethod.label", {
                    defaultValue: "Recommendation method",
                  })}
                </p>
                {recommendationMethod || ""}
              </div>
              <div className="margin-bottom-3">
                <p className="text-bold margin-bottom-2">
                  {t("recommendationMethodDetails.label", {
                    defaultValue: "Recommendation method details",
                  })}
                </p>
                {recommendationMethodDetails || ""}
              </div>
              <div className="border-top border-base-lighter margin-top-2 margin-bottom-2" />
              <div className="margin-bottom-3">
                <p className="text-bold margin-bottom-2">
                  {t("otherKeyInformation.label", {
                    defaultValue: "Other key information",
                  })}
                </p>
                <SummaryDescriptionDisplay
                  summaryDescription={otherKeyInformation || ""}
                />
              </div>
            </div>
          </div>
        </Grid>
      </Grid>
    </div>
  );
};
