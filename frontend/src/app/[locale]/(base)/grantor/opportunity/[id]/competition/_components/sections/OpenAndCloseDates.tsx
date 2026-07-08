"use client";

import { useTranslations } from "next-intl";
import { DatePicker, FormGroup, Radio } from "@trussworks/react-uswds";

import { DynamicFieldLabel } from "src/components/core/forms/DynamicFieldLabel";

export function OpenAndCloseDates() {
  const t = useTranslations("OpportunityCompetition.sectionOpenAndCloseDates");

  return (
    <div
      id="open-and-close-dates"
      className="padding-bottom-4 border-bottom border-base-lighter margin-top-4 simpler-page-anchor-offset"
    >
      <h2 className="font-heading-lg margin-top-0 margin-bottom-1">
        {t("header")}
      </h2>
      <FormGroup>
        <DynamicFieldLabel
          idFor="how-does-this-close"
          title={t("howDoesThisClose")}
          required={true}
          description={t("howDoesThisCloseHint")}
        />
        <div className="grid-row grid-gap-2">
          <div className="tablet:grid-col">
            <Radio
              id="hard-deadline"
              name="howDoesThisClose"
              label={t("hardDeadline")}
              labelDescription={t("hardDeadlineHint")}
              value="hard_deadline"
            />
          </div>
          <div className="tablet:grid-col">
            <Radio
              id="rolling-deadline"
              name="howDoesThisClose"
              label={t("rollingDeadline")}
              labelDescription={t("rollingDeadlineHint")}
              value="rolling_deadline"
            />
          </div>
          <div className="tablet:grid-col">
            <Radio
              id="continuous-review"
              name="howDoesThisClose"
              label={t("continuousReview")}
              labelDescription={t("continuousReviewHint")}
              value="continuous_review"
            />
          </div>
        </div>
      </FormGroup>
      <div className="grid-row grid-gap-lg">
        <div className="tablet:grid-col-6">
          <FormGroup>
            <DynamicFieldLabel
              idFor="open-date"
              title={t("openDate")}
              description={t("openDateHint")}
            />
            <DatePicker
              id="open-date"
              name="openDate"
              placeholder="mm/dd/yyyy"
              className="width-full"
            />
          </FormGroup>
        </div>
        <div className="tablet:grid-col-6">
          <FormGroup>
            <DynamicFieldLabel
              idFor="close-date"
              title={t("closeDate")}
              description={t("closeDateHint")}
            />
            <DatePicker
              id="close-date"
              name="closeDate"
              placeholder="mm/dd/yyyy"
              className="width-full"
            />
          </FormGroup>
        </div>
      </div>
    </div>
  );
}
