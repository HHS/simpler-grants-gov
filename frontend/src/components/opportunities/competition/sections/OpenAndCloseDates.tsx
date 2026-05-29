"use client";

import { useTranslations } from "next-intl";
import { DatePicker, FormGroup, Radio } from "@trussworks/react-uswds";

import { DynamicFieldLabel } from "src/components/applyForm/widgets/DynamicFieldLabel";

export function OpenAndCloseDates() {
  const t = useTranslations("OpportunityCompetition");

  return (
    <div
      id="open-and-close-dates"
      className="padding-bottom-4 border-bottom border-base-lighter margin-top-4 simpler-page-anchor-offset"
    >
      <h2 className="font-heading-lg margin-top-0 margin-bottom-1">
        {t("sections.openAndCloseDates")}
      </h2>
      <FormGroup>
        <DynamicFieldLabel
          idFor="how-does-this-close"
          title={t("sections.howDoesThisClose")}
          required={true}
          description={t("sections.howDoesThisCloseHint")}
        />
        <div className="grid-row grid-gap-2">
          <div className="tablet:grid-col">
            <Radio
              id="hard-deadline"
              name="howDoesThisClose"
              label={t("sections.hardDeadline")}
              labelDescription={t("sections.hardDeadlineHint")}
              value="hard_deadline"
            />
          </div>
          <div className="tablet:grid-col">
            <Radio
              id="rolling-deadline"
              name="howDoesThisClose"
              label={t("sections.rollingDeadline")}
              labelDescription={t("sections.rollingDeadlineHint")}
              value="rolling_deadline"
            />
          </div>
          <div className="tablet:grid-col">
            <Radio
              id="continuous-review"
              name="howDoesThisClose"
              label={t("sections.continuousReview")}
              labelDescription={t("sections.continuousReviewHint")}
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
              title={t("sections.openDate")}
              description={t("sections.openDateHint")}
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
              title={t("sections.closeDate")}
              description={t("sections.closeDateHint")}
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
