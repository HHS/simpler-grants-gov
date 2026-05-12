"use client";

import {
  AwardRecommendationSubmission,
  AwardRecommendationType,
} from "src/types/awardRecommendationTypes";
import { formatCurrency } from "src/utils/formatCurrencyUtil";

import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  CharacterCount,
  Checkbox,
  Grid,
  Label,
  Select,
  TextInput,
} from "@trussworks/react-uswds";

const exceptionEligibleRecommendationTypes: AwardRecommendationType[] = [
  "recommended_without_funding",
  "not_recommended",
];

const formatCurrencyString = (value?: string) => {
  if (!value) return "";

  const parsedValue = Number(value.replace(/[$,\s]/g, ""));
  if (Number.isNaN(parsedValue)) return value;

  return formatCurrency(parsedValue);
};

type RecommendationDetailFormProps = {
  submission: AwardRecommendationSubmission;
};

const RecommendationDetailForm = ({
  submission,
}: RecommendationDetailFormProps) => {
  const t = useTranslations("AwardRecommendation.recommendationDetails");
  const detail = submission.submission_detail;
  const submissionId =
    submission.award_recommendation_application_submission_id;
  const initialRecommendationType =
    detail?.award_recommendation_type ?? "recommended_for_funding";
  const [recommendationType, setRecommendationType] =
    useState<AwardRecommendationType>(initialRecommendationType);
  const [hasException, setHasException] = useState(
    Boolean(detail?.has_exception),
  );
  const [recommendedAmount, setRecommendedAmount] = useState(
    formatCurrencyString(detail?.recommended_amount),
  );

  const canHaveException =
    exceptionEligibleRecommendationTypes.includes(recommendationType);
  const showExceptionDetail = canHaveException && hasException;

  return (
    <div className="margin-bottom-4" data-testid="recommendation-detail-form">
      <div className="margin-bottom-3">
        <Label
          htmlFor={`award_recommendation_type_${submissionId}`}
          className="text-bold margin-bottom-1"
          requiredMarker
        >
          {t("recommendationLabel")}
        </Label>
        <Select
          id={`award_recommendation_type_${submissionId}`}
          name={`award_recommendation_submissions[${submissionId}][award_recommendation_type]`}
          value={recommendationType}
          onChange={(event) => {
            const nextRecommendationType = event.target
              .value as AwardRecommendationType;
            setRecommendationType(nextRecommendationType);

            if (
              !exceptionEligibleRecommendationTypes.includes(
                nextRecommendationType,
              )
            ) {
              setHasException(false);
            }
          }}
          className="maxw-card-lg"
        >
          <option value="recommended_for_funding">
            {t("recommendationOptions.recommended")}
          </option>
          <option value="recommended_without_funding">
            {t("recommendationOptions.recommendedWithoutFunding")}
          </option>
          <option value="not_recommended">
            {t("recommendationOptions.notRecommended")}
          </option>
        </Select>
      </div>

      {canHaveException && (
        <Checkbox
          id={`has_exception_${submissionId}`}
          name={`award_recommendation_submissions[${submissionId}][has_exception]`}
          label={t("hasExceptionLabel")}
          checked={hasException}
          onChange={(event) => setHasException(event.target.checked)}
        />
      )}

      <div className="margin-top-3 margin-bottom-3">
        <p className="text-bold margin-bottom-1 font-sans-sm">
          {t("commentsLabel")}
        </p>
        <p className="text-base margin-top-1 margin-bottom-2">
          {t("commentsDescription")}
        </p>
        <CharacterCount
          id={`general_comment_${submissionId}`}
          name={`award_recommendation_submissions[${submissionId}][general_comment]`}
          maxLength={1000}
          isTextArea
          defaultValue={detail?.general_comment || ""}
          rows={6}
          className="maxw-full"
          data-testid="recommendation-comments-textarea"
        />
      </div>

      {showExceptionDetail && (
        <div className="margin-bottom-3">
          <p className="text-bold margin-bottom-1 font-sans-sm">
            {t("exceptionDetailLabel")}
          </p>
          <p className="text-base margin-top-1 margin-bottom-2">
            {t("exceptionDetailDescription")}
          </p>
          <CharacterCount
            id={`exception_detail_${submissionId}`}
            name={`award_recommendation_submissions[${submissionId}][exception_detail]`}
            maxLength={1000}
            isTextArea
            defaultValue={detail?.exception_detail || ""}
            rows={6}
            className="maxw-full"
            data-testid="exception-detail-textarea"
          />
        </div>
      )}

      <div className="margin-top-4">
        <h3 className="margin-top-0 margin-bottom-3 font-sans-md">
          {t("fundingHeading")}
        </h3>
        <Grid row gap>
          <Grid col={12} tablet={{ col: 6 }}>
            <p className="text-bold margin-bottom-1 font-sans-sm">
              {t("amountRequestedLabel")}
            </p>
            <p className="margin-top-1">
              {formatCurrencyString(
                submission.application_submission.total_requested_amount,
              )}
            </p>
          </Grid>
          <Grid col={12} tablet={{ col: 6 }}>
            <Label
              htmlFor={`recommended_amount_${submissionId}`}
              className="text-bold margin-top-0 margin-bottom-1"
              requiredMarker
            >
              {t("amountRecommendedLabel")}
            </Label>
            <TextInput
              id={`recommended_amount_${submissionId}`}
              name={`award_recommendation_submissions[${submissionId}][recommended_amount]`}
              type="text"
              value={recommendedAmount}
              onChange={(event) => setRecommendedAmount(event.target.value)}
              onBlur={(event) =>
                setRecommendedAmount(formatCurrencyString(event.target.value))
              }
            />
          </Grid>
        </Grid>
      </div>
    </div>
  );
};

export const RecommendationDetailsSection = ({
  submission,
}: {
  submission: AwardRecommendationSubmission;
}) => {
  const t = useTranslations("AwardRecommendation.recommendationDetails");

  return (
    <div>
      <Grid row className="grid-gap">
        <Grid col={9} tablet={{ col: 9 }}>
          <div className="margin-top-3 margin-bottom-3">
            <h2 className="margin-top-0 margin-bottom-2">{t("heading")}</h2>
            <RecommendationDetailForm submission={submission} />
          </div>
        </Grid>
      </Grid>
    </div>
  );
};
