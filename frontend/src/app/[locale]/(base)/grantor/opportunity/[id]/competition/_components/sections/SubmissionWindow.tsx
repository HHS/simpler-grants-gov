"use client";

import { useTranslations } from "next-intl";
import { DatePicker, FormGroup, TextInput } from "@trussworks/react-uswds";

import { DynamicFieldLabel } from "src/components/core/forms/DynamicFieldLabel";

type SubmissionWindowProps = {
  openingDate?: string | null;
  closingDate?: string | null;
  gracePeriod?: number | null;
  readOnly?: boolean;
};

export function SubmissionWindow({
  openingDate,
  closingDate,
  gracePeriod,
  readOnly = false,
}: SubmissionWindowProps) {
  const t = useTranslations("OpportunityCompetition.sectionSubmissionWindow");

  return (
    <div
      id="submission-window"
      className="padding-bottom-4 border-bottom border-base-lighter margin-top-4 simpler-page-anchor-offset"
    >
      <h2 className="font-heading-lg margin-top-0 margin-bottom-1">
        {t("header")}
      </h2>
      <p className="font-body-md text-base-dark margin-top-0">
        {t("subHeader")}
      </p>
      <div className="grid-row grid-gap-lg">
        <div className="tablet:grid-col-6">
          <FormGroup>
            <DynamicFieldLabel
              idFor="opening_date"
              title={t("submissionsOpen")}
              description={t("submissionsOpenHint")}
            />
            <DatePicker
              id="opening_date"
              disabled={readOnly}
              name="opening_date"
              defaultValue={openingDate ?? ""}
              placeholder="mm/dd/yyyy"
              className="width-full"
            />
          </FormGroup>
        </div>
        <div className="tablet:grid-col-6">
          <FormGroup>
            <DynamicFieldLabel
              idFor="closing_date"
              title={t("submissionsClose")}
              description={t("submissionsCloseHint")}
              required={true}
            />
            <DatePicker
              id="closing_date"
              disabled={readOnly}
              name="closing_date"
              defaultValue={closingDate ?? ""}
              placeholder="mm/dd/yyyy"
              className="width-full"
            />
          </FormGroup>
        </div>
      </div>
      <div className="grid-row grid-gap-lg margin-top-3">
        <div className="tablet:grid-col-6">
          <FormGroup>
            <DynamicFieldLabel
              idFor="grace_period"
              title={t("gracePeriod")}
              description={t("gracePeriodHint")}
            />
            <TextInput
              id="grace_period"
              disabled={readOnly}
              name="grace_period"
              type="number"
              min="0"
              step="1"
              className="width-full"
              defaultValue={gracePeriod ?? undefined}
              onKeyDown={(e) => {
                if (
                  e.key === "." ||
                  e.key === "," ||
                  e.key === "e" ||
                  e.key === "E"
                ) {
                  e.preventDefault();
                }
              }}
              onPaste={(e) => {
                const pastedText = e.clipboardData.getData("text");
                if (pastedText.includes(".") || pastedText.includes(",")) {
                  e.preventDefault();
                }
              }}
            />
          </FormGroup>
        </div>
      </div>
    </div>
  );
}
