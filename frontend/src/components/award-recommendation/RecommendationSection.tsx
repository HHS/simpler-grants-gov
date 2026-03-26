"use client";

import { useTranslations } from "next-intl";
import { CharacterCount, Grid, Radio } from "@trussworks/react-uswds";

import { SummaryDescriptionDisplay } from "src/components/opportunity/OpportunityDescription";

type RecommendationSectionProps = {
  mode: "view" | "edit";
  recommendationMethod?: string;
  recommendationMethodDetails?: string;
  otherKeyInformation?: string;
};

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
                    {t("recommendationMethod.label")}
                  </p>
                  <p className="text-base margin-top-1 margin-bottom-2">
                    {t("recommendationMethod.description")}
                  </p>
                  <Radio
                    id="merit_review_only"
                    name="award_selection_method"
                    label={t("recommendationMethod.meritReviewOnly")}
                    value="merit-review-only"
                    defaultChecked={
                      recommendationMethod === "merit-review-only"
                    }
                  />
                  <Radio
                    id="merit_review_other"
                    name="award_selection_method"
                    label={t("recommendationMethod.meritReviewOther")}
                    value="merit-review-other"
                    defaultChecked={
                      recommendationMethod === "merit-review-other"
                    }
                  />
                </div>
                <div className="margin-bottom-3">
                  <p className="text-bold margin-bottom-2">
                    {t("recommendationMethodDetails.label")}
                  </p>
                  <p className="text-base margin-top-1 margin-bottom-2">
                    {t("recommendationMethodDetails.description")}
                  </p>
                  <CharacterCount
                    id="award_selection_details"
                    name="award_selection_details"
                    maxLength={500}
                    isTextArea
                    defaultValue={recommendationMethodDetails || ""}
                    rows={6}
                    className="maxw-full"
                    data-testid="award-selection-details-textarea"
                  />
                </div>
                <div className="border-top border-base-lighter margin-top-4 margin-bottom-4" />
                <div className="margin-bottom-3">
                  <p className="text-bold margin-bottom-1 font-sans-sm">
                    {t("otherKeyInformation.label")}
                  </p>
                  <p className="text-base margin-top-1 margin-bottom-2">
                    {t("otherKeyInformation.description")}
                  </p>
                  <CharacterCount
                    id="other_key_information"
                    name="other_key_information"
                    maxLength={500}
                    isTextArea
                    defaultValue={otherKeyInformation || ""}
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
                  {t("recommendationMethod.label")}
                </p>
                {recommendationMethod || ""}
              </div>
              <div className="margin-bottom-3">
                <p className="text-bold margin-bottom-2">
                  {t("recommendationMethodDetails.label")}
                </p>
                <SummaryDescriptionDisplay
                  summaryDescription={recommendationMethodDetails || ""}
                />
              </div>
              <div className="border-top border-base-lighter margin-top-2 margin-bottom-2" />
              <div className="margin-bottom-3">
                <p className="text-bold margin-bottom-2">
                  {t("otherKeyInformation.label")}
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
