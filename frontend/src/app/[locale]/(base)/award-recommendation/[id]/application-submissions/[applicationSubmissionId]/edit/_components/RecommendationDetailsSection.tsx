"use client";

import {
  AwardRecommendationSubmission,
  AwardRecommendationType,
} from "src/types/awardRecommendationTypes";
import {
  formatCurrency,
  formatCurrencyString,
  getNumericAmountFromString,
} from "src/utils/formatCurrencyUtil";

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

import { RequiredFieldIndicator } from "src/components/core/RequiredFieldIndicator";

const exceptionEligibleRecommendationTypes: AwardRecommendationType[] = [
  "recommended_without_funding",
  "not_recommended",
];

const defaultHasExceptionByRecommendationType: Record<
  AwardRecommendationType,
  boolean
> = {
  recommended_for_funding: false,
  recommended_without_funding: true,
  not_recommended: false,
};

type RecommendationDetailFormProps = {
  submission?: AwardRecommendationSubmission;
  submissions?: AwardRecommendationSubmission[];
};

type RecommendationFieldsProps = {
  submissionId: string;
  namePrefix: string;
  generalCommentDefaultValue?: string;
  exceptionDetailDefaultValue?: string;
  initialRecommendationType?: AwardRecommendationType;
  initialHasException?: boolean;
};

const RecommendationFields = ({
  submissionId,
  namePrefix,
  generalCommentDefaultValue,
  exceptionDetailDefaultValue,
  initialRecommendationType = "recommended_for_funding",
  initialHasException = false,
}: RecommendationFieldsProps) => {
  const t = useTranslations("AwardRecommendation.recommendationDetails");
  const [recommendationType, setRecommendationType] =
    useState<AwardRecommendationType>(initialRecommendationType);
  const [hasException, setHasException] = useState(initialHasException);

  const canHaveException =
    exceptionEligibleRecommendationTypes.includes(recommendationType);
  const showExceptionDetail = canHaveException && hasException;

  return (
    <>
      <div className="margin-bottom-3">
        <Label
          htmlFor={`award_recommendation_type_${submissionId}`}
          className="text-bold margin-bottom-1"
        >
          <span>{t("recommendationLabel")}</span>
          <RequiredFieldIndicator> *</RequiredFieldIndicator>
        </Label>
        <Select
          id={`award_recommendation_type_${submissionId}`}
          name={`${namePrefix}[award_recommendation_type]`}
          value={recommendationType}
          onChange={(event) => {
            const nextRecommendationType = event.target
              .value as AwardRecommendationType;
            setRecommendationType(nextRecommendationType);
            setHasException(
              defaultHasExceptionByRecommendationType[nextRecommendationType],
            );
          }}
          className="maxw-card-lg"
          required
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
          name={`${namePrefix}[has_exception]`}
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
          name={`${namePrefix}[general_comment]`}
          maxLength={1000}
          isTextArea
          defaultValue={generalCommentDefaultValue || ""}
          rows={6}
          className="maxw-full"
          data-testid="recommendation-comments-textarea"
        />
      </div>

      {showExceptionDetail && (
        <div className="margin-bottom-3">
          <p className="text-bold margin-bottom-1 font-sans-sm">
            <span>{t("exceptionDetailLabel")}</span>
            <RequiredFieldIndicator> *</RequiredFieldIndicator>
          </p>
          <p className="text-base margin-top-1 margin-bottom-2">
            {t("exceptionDetailDescription")}
          </p>
          <CharacterCount
            id={`exception_detail_${submissionId}`}
            name={`${namePrefix}[exception_detail]`}
            maxLength={1000}
            isTextArea
            defaultValue={exceptionDetailDefaultValue || ""}
            rows={6}
            className="maxw-full"
            data-testid="exception-detail-textarea"
            required
          />
        </div>
      )}
    </>
  );
};

const FundingRecommendationRow = ({
  submission,
}: {
  submission: AwardRecommendationSubmission;
}) => {
  const submissionId =
    submission.award_recommendation_application_submission_id;
  const [recommendedAmount, setRecommendedAmount] = useState(
    formatCurrencyString(submission.submission_detail?.recommended_amount),
  );

  return (
    <tr>
      <td>{submission.application_submission.application?.application_id}</td>
      <td>
        {formatCurrencyString(
          submission.application_submission.total_requested_amount,
        )}
      </td>
      <td>
        <TextInput
          id={`recommended_amount_${submissionId}`}
          name={`award_recommendation_submissions[${submissionId}][recommended_amount]`}
          type="text"
          value={recommendedAmount}
          onChange={(event) => setRecommendedAmount(event.target.value)}
          onBlur={(event) =>
            setRecommendedAmount(formatCurrencyString(event.target.value))
          }
          required
        />
      </td>
    </tr>
  );
};

const FundingSectionMultiple = ({
  submissions,
}: {
  submissions: AwardRecommendationSubmission[];
}) => {
  const t = useTranslations("AwardRecommendation.recommendationDetails");

  return (
    <div className="margin-top-4">
      <h3 className="margin-top-0 margin-bottom-3 font-sans-md">
        {t("fundingHeading")}
      </h3>
      <div className="usa-table-container--scrollable" tabIndex={0}>
        <table className="usa-table usa-table--borderless width-full">
          <thead>
            <tr>
              <th
                scope="col"
                className="bg-base-lightest padding-y-205 minw-15"
              >
                {t("applicationIdLabel")}
              </th>
              <th
                scope="col"
                className="bg-base-lightest padding-y-205 minw-15"
              >
                {t("amountRequestedLabel")}
              </th>
              <th
                scope="col"
                className="bg-base-lightest padding-y-205 minw-15"
              >
                <span>{t("amountRecommendedLabel")}</span>
                <RequiredFieldIndicator> *</RequiredFieldIndicator>
              </th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((sub) => (
              <FundingRecommendationRow
                key={sub.award_recommendation_application_submission_id}
                submission={sub}
              />
            ))}
            <tr>
              <td>{t("totalLabel")}</td>
              <td>
                {formatCurrency(
                  submissions.reduce(
                    (sum, s) =>
                      sum +
                      getNumericAmountFromString(
                        s.application_submission.total_requested_amount,
                      ),
                    0,
                  ),
                )}
              </td>
              <td>
                {formatCurrency(
                  submissions.reduce(
                    (sum, s) =>
                      sum +
                      getNumericAmountFromString(
                        s.submission_detail?.recommended_amount,
                      ),
                    0,
                  ),
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

const FundingSectionSingle = ({
  submission,
}: {
  submission: AwardRecommendationSubmission;
}) => {
  const t = useTranslations("AwardRecommendation.recommendationDetails");
  const submissionId =
    submission.award_recommendation_application_submission_id;
  const [recommendedAmount, setRecommendedAmount] = useState(
    formatCurrencyString(submission.submission_detail?.recommended_amount),
  );

  return (
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
          >
            <span>{t("amountRecommendedLabel")}</span>
            <RequiredFieldIndicator> *</RequiredFieldIndicator>
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
            required
          />
        </Grid>
      </Grid>
    </div>
  );
};

export const RecommendationDetailForm = ({
  submission,
  submissions,
}: RecommendationDetailFormProps) => {
  const isMultipleSubmissions = submissions && submissions.length > 1;
  const singleSubmission =
    submission ||
    (submissions && submissions.length === 1 ? submissions[0] : null);

  if (!singleSubmission && !isMultipleSubmissions) {
    return null;
  }

  if (isMultipleSubmissions) {
    return (
      <div className="margin-bottom-4" data-testid="recommendation-detail-form">
        <RecommendationFields submissionId="bulk" namePrefix="bulk_edit[" />
        <FundingSectionMultiple submissions={submissions} />
      </div>
    );
  }

  const detail = singleSubmission!.submission_detail;
  const submissionId =
    singleSubmission!.award_recommendation_application_submission_id;

  return (
    <div className="margin-bottom-4" data-testid="recommendation-detail-form">
      <RecommendationFields
        submissionId={submissionId}
        namePrefix={`award_recommendation_submissions[${submissionId}]`}
        generalCommentDefaultValue={detail?.general_comment}
        exceptionDetailDefaultValue={detail?.exception_detail}
        initialRecommendationType={
          detail?.award_recommendation_type ?? "recommended_for_funding"
        }
        initialHasException={Boolean(detail?.has_exception)}
      />
      <FundingSectionSingle submission={singleSubmission!} />
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
