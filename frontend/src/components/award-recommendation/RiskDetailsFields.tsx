"use client";

import { useTranslations } from "next-intl";
import {
  Button,
  ButtonGroup,
  CharacterCount,
  ErrorMessage,
  FormGroup,
  Select,
} from "@trussworks/react-uswds";

type RiskDetailsFieldsProps = {
  riskSummary: string;
  onRiskSummaryChange: (value: string) => void;
  onRiskSummaryBlur: () => void;
  riskSummaryError: string | null;
  selectedCondition: string;
  onSelectedConditionChange: (value: string) => void;
  isSubmitting: boolean;
  onCancel: () => void;
  onSave: () => void;
};

export default function RiskDetailsFields({
  riskSummary,
  onRiskSummaryChange,
  onRiskSummaryBlur,
  riskSummaryError,
  selectedCondition,
  onSelectedConditionChange,
  isSubmitting,
  onCancel,
  onSave,
}: RiskDetailsFieldsProps) {
  const t = useTranslations("AwardRecommendation.risks");

  return (
    <div className="margin-top-6">
      <h2 className="margin-top-0 margin-bottom-3">
        {t("riskDetailsHeading")}
      </h2>

      <FormGroup error={!!riskSummaryError}>
        <label className="usa-label text-bold" htmlFor="risk-summary">
          {t("riskSummaryLabel")}
          <span className="usa-hint usa-hint--required text-no-underline">
            *
          </span>
        </label>
        <span className="usa-hint">{t("riskSummaryHint")}</span>
        {riskSummaryError && <ErrorMessage>{riskSummaryError}</ErrorMessage>}
        <CharacterCount
          id="risk-summary"
          name="risk-summary"
          maxLength={1000}
          isTextArea
          rows={6}
          value={riskSummary}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            onRiskSummaryChange(e.target.value)
          }
          onBlur={onRiskSummaryBlur}
          className="maxw-tablet-lg"
        />
      </FormGroup>

      <div className="margin-top-3">
        <label className="usa-label text-bold" htmlFor="recommended-condition">
          {t("recommendedConditionLabel")}
        </label>
        <span className="usa-hint">{t("recommendedConditionHint")}</span>
        <Select
          id="recommended-condition"
          name="recommended-condition"
          value={selectedCondition}
          onChange={(e) => onSelectedConditionChange(e.target.value)}
          className="maxw-tablet-lg"
        >
          <option value="">{t("selectConditionPlaceholder")}</option>
          <option value="condition1">{t("condition1")}</option>
          <option value="condition2">{t("condition2")}</option>
          <option value="condition3">{t("condition3")}</option>
        </Select>
      </div>

      <ButtonGroup className="margin-top-4">
        <Button
          type="button"
          onClick={onCancel}
          outline
          disabled={isSubmitting}
        >
          {t("cancelButton")}
        </Button>
        <Button type="button" onClick={onSave} disabled={isSubmitting}>
          {isSubmitting ? t("savingButton") : t("saveButton")}
        </Button>
      </ButtonGroup>
    </div>
  );
}
