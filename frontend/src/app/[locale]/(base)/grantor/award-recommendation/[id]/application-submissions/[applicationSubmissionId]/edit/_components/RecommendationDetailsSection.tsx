"use client";

import {
  AwardRecommendationSubmission,
  AwardRecommendationType,
} from "src/types/awardRecommendationTypes";
import {
  formatCurrency,
  formatCurrencyString,
  getNumericAmountFromString,
  sanitizeCurrencyInput,
} from "src/utils/formatCurrencyUtil";

import { useTranslations } from "next-intl";
import {
  ChangeEvent,
  ForwardedRef,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import {
  Alert,
  CharacterCount,
  Checkbox,
  ErrorMessage,
  FormGroup,
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

const isAmountEmpty = (value: string) =>
  (value ?? "").replace(/[$,\s]/g, "") === "";

export type RecommendationFieldErrors = {
  recommendation?: string;
  exceptionDetail?: string;
  recommendedAmount?: string;
  recommendedAmounts?: Record<string, string>;
};

export type RecommendationDetailFormHandle = {
  validate: () => boolean;
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
  recommendationType: AwardRecommendationType | "";
  hasException: boolean;
  exceptionDetail: string;
  onRecommendationTypeChange: (value: AwardRecommendationType | "") => void;
  onHasExceptionChange: (value: boolean) => void;
  onExceptionDetailChange: (value: string) => void;
  errors: RecommendationFieldErrors;
};

const RecommendationFields = ({
  submissionId,
  namePrefix,
  generalCommentDefaultValue,
  recommendationType,
  hasException,
  exceptionDetail,
  onRecommendationTypeChange,
  onHasExceptionChange,
  onExceptionDetailChange,
  errors,
}: RecommendationFieldsProps) => {
  const t = useTranslations("AwardRecommendation.recommendationDetails");

  const canHaveException =
    recommendationType !== "" &&
    exceptionEligibleRecommendationTypes.includes(recommendationType);
  const showExceptionDetail = canHaveException && hasException;

  return (
    <>
      <FormGroup error={!!errors.recommendation} className="margin-bottom-3">
        <Label
          htmlFor={`award_recommendation_type_${submissionId}`}
          className="text-bold margin-bottom-1"
        >
          <span>{t("recommendationLabel")}</span>
          <RequiredFieldIndicator> *</RequiredFieldIndicator>
        </Label>
        {errors.recommendation && (
          <ErrorMessage>{errors.recommendation}</ErrorMessage>
        )}
        <Select
          id={`award_recommendation_type_${submissionId}`}
          name={`${namePrefix}[award_recommendation_type]`}
          value={recommendationType}
          onChange={(event) => {
            const nextValue = event.target.value as
              AwardRecommendationType | "";
            onRecommendationTypeChange(nextValue);
            if (nextValue === "") {
              onHasExceptionChange(false);
              return;
            }
            onHasExceptionChange(
              defaultHasExceptionByRecommendationType[nextValue],
            );
          }}
          className="maxw-card-lg"
        >
          <option value="">{t("selectOnePlaceholder")}</option>
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
      </FormGroup>

      {canHaveException && (
        <Checkbox
          id={`has_exception_${submissionId}`}
          name={`${namePrefix}[has_exception]`}
          label={t("hasExceptionLabel")}
          checked={hasException}
          onChange={(event) => onHasExceptionChange(event.target.checked)}
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
        <FormGroup error={!!errors.exceptionDetail} className="margin-bottom-3">
          <Label
            htmlFor={`exception_detail_${submissionId}`}
            className="text-bold margin-bottom-1"
          >
            <span>{t("exceptionDetailLabel")}</span>
            <RequiredFieldIndicator> *</RequiredFieldIndicator>
          </Label>
          <p className="text-base margin-top-1 margin-bottom-2">
            {t("exceptionDetailDescription")}
          </p>
          {errors.exceptionDetail && (
            <ErrorMessage>{errors.exceptionDetail}</ErrorMessage>
          )}
          <CharacterCount
            id={`exception_detail_${submissionId}`}
            name={`${namePrefix}[exception_detail]`}
            maxLength={1000}
            isTextArea
            value={exceptionDetail}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
              onExceptionDetailChange(event.target.value)
            }
            rows={6}
            className="maxw-full"
            data-testid="exception-detail-textarea"
          />
        </FormGroup>
      )}
    </>
  );
};

const FundingRecommendationRow = ({
  submission,
  recommendedAmount,
  onRecommendedAmountChange,
  error,
}: {
  submission: AwardRecommendationSubmission;
  recommendedAmount: string;
  onRecommendedAmountChange: (value: string) => void;
  error?: string;
}) => {
  const submissionId =
    submission.award_recommendation_application_submission_id;

  return (
    <tr>
      <td>{submission.application_submission.application?.application_id}</td>
      <td>
        {formatCurrencyString(
          submission.application_submission.total_requested_amount,
        )}
      </td>
      <td>
        <FormGroup error={!!error} className="margin-0">
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <TextInput
            id={`recommended_amount_${submissionId}`}
            name={`award_recommendation_submissions[${submissionId}][recommended_amount]`}
            type="text"
            inputMode="decimal"
            value={recommendedAmount}
            onChange={(event) =>
              onRecommendedAmountChange(
                sanitizeCurrencyInput(event.target.value),
              )
            }
            onBlur={(event) =>
              onRecommendedAmountChange(
                formatCurrencyString(event.target.value),
              )
            }
            validationStatus={error ? "error" : undefined}
          />
        </FormGroup>
      </td>
    </tr>
  );
};

const FundingSectionMultiple = ({
  submissions,
  recommendedAmounts,
  onRecommendedAmountChange,
  amountErrors,
}: {
  submissions: AwardRecommendationSubmission[];
  recommendedAmounts: Record<string, string>;
  onRecommendedAmountChange: (submissionId: string, value: string) => void;
  amountErrors?: Record<string, string>;
}) => {
  const t = useTranslations("AwardRecommendation.recommendationDetails");

  const totalRequested = submissions.reduce(
    (sum, s) =>
      sum +
      getNumericAmountFromString(
        s.application_submission.total_requested_amount,
      ),
    0,
  );

  const totalRecommended = submissions.reduce((sum, s) => {
    const submissionId = s.award_recommendation_application_submission_id;
    return sum + getNumericAmountFromString(recommendedAmounts[submissionId]);
  }, 0);

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
                recommendedAmount={
                  recommendedAmounts[
                    sub.award_recommendation_application_submission_id
                  ]
                }
                onRecommendedAmountChange={(value) =>
                  onRecommendedAmountChange(
                    sub.award_recommendation_application_submission_id,
                    value,
                  )
                }
                error={
                  amountErrors?.[
                    sub.award_recommendation_application_submission_id
                  ]
                }
              />
            ))}
            <tr>
              <td>{t("totalLabel")}</td>
              <td>{formatCurrency(totalRequested)}</td>
              <td>{formatCurrency(totalRecommended)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

const FundingSectionSingle = ({
  submission,
  recommendedAmount,
  onRecommendedAmountChange,
  error,
}: {
  submission: AwardRecommendationSubmission;
  recommendedAmount: string;
  onRecommendedAmountChange: (value: string) => void;
  error?: string;
}) => {
  const t = useTranslations("AwardRecommendation.recommendationDetails");
  const submissionId =
    submission.award_recommendation_application_submission_id;

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
          <FormGroup error={!!error}>
            <Label
              htmlFor={`recommended_amount_${submissionId}`}
              className="text-bold margin-top-0 margin-bottom-1"
            >
              <span>{t("amountRecommendedLabel")}</span>
              <RequiredFieldIndicator> *</RequiredFieldIndicator>
            </Label>
            {error && <ErrorMessage>{error}</ErrorMessage>}
            <TextInput
              id={`recommended_amount_${submissionId}`}
              name={`award_recommendation_submissions[${submissionId}][recommended_amount]`}
              type="text"
              inputMode="decimal"
              value={recommendedAmount}
              onChange={(event) =>
                onRecommendedAmountChange(
                  sanitizeCurrencyInput(event.target.value),
                )
              }
              onBlur={(event) =>
                onRecommendedAmountChange(
                  formatCurrencyString(event.target.value),
                )
              }
              validationStatus={error ? "error" : undefined}
            />
          </FormGroup>
        </Grid>
      </Grid>
    </div>
  );
};

export const RecommendationDetailForm = forwardRef(
  function RecommendationDetailForm(
    { submission, submissions }: RecommendationDetailFormProps,
    ref: ForwardedRef<RecommendationDetailFormHandle>,
  ) {
    const t = useTranslations("AwardRecommendation.recommendationDetails");
    const isMultipleSubmissions = submissions && submissions.length > 1;
    const singleSubmission =
      submission ||
      (submissions && submissions.length === 1 ? submissions[0] : null);

    const initialDetail = singleSubmission?.submission_detail;
    const [recommendationType, setRecommendationType] = useState<
      AwardRecommendationType | ""
    >(initialDetail?.award_recommendation_type ?? "");
    const [hasException, setHasException] = useState(
      Boolean(initialDetail?.has_exception),
    );
    const [exceptionDetail, setExceptionDetail] = useState(
      initialDetail?.exception_detail ?? "",
    );
    const [errors, setErrors] = useState<RecommendationFieldErrors>({});

    const [singleRecommendedAmount, setSingleRecommendedAmount] = useState(
      formatCurrencyString(initialDetail?.recommended_amount),
    );
    const [recommendedAmounts, setRecommendedAmounts] = useState<
      Record<string, string>
    >(() => {
      const initial: Record<string, string> = {};
      (submissions ?? []).forEach((sub) => {
        initial[sub.award_recommendation_application_submission_id] =
          formatCurrencyString(sub.submission_detail?.recommended_amount);
      });
      return initial;
    });

    const validate = (): boolean => {
      const nextErrors: RecommendationFieldErrors = {};

      if (!recommendationType) {
        nextErrors.recommendation = t("recommendationRequired");
      }

      const canHaveException =
        recommendationType !== "" &&
        exceptionEligibleRecommendationTypes.includes(recommendationType);
      if (canHaveException && hasException && !exceptionDetail.trim()) {
        nextErrors.exceptionDetail = t("exceptionDetailRequired");
      }

      if (isMultipleSubmissions && submissions) {
        const amountErrors: Record<string, string> = {};
        submissions.forEach((sub) => {
          const id = sub.award_recommendation_application_submission_id;
          if (isAmountEmpty(recommendedAmounts[id] ?? "")) {
            amountErrors[id] = t("amountRecommendedRequired");
          }
        });
        if (Object.keys(amountErrors).length > 0) {
          nextErrors.recommendedAmounts = amountErrors;
          // Also surface a single amount message in the top alert
          nextErrors.recommendedAmount = t("amountRecommendedRequired");
        }
      } else if (isAmountEmpty(singleRecommendedAmount)) {
        nextErrors.recommendedAmount = t("amountRecommendedRequired");
      }

      setErrors(nextErrors);
      return Object.keys(nextErrors).length === 0;
    };

    useImperativeHandle(ref, () => ({ validate }), [
      recommendationType,
      hasException,
      exceptionDetail,
      singleRecommendedAmount,
      recommendedAmounts,
      isMultipleSubmissions,
      submissions,
      t,
    ]);

    if (!singleSubmission && !isMultipleSubmissions) {
      return null;
    }

    const alertMessages = [
      errors.recommendation,
      errors.exceptionDetail,
      errors.recommendedAmount,
    ].filter(Boolean) as string[];

    const submissionId = isMultipleSubmissions
      ? "bulk"
      : singleSubmission!.award_recommendation_application_submission_id;
    const namePrefix = isMultipleSubmissions
      ? "bulk_edit"
      : `award_recommendation_submissions[${submissionId}]`;

    return (
      <div className="margin-bottom-4" data-testid="recommendation-detail-form">
        {alertMessages.length > 0 && (
          <Alert
            type="error"
            heading={t("validationErrorHeading")}
            headingLevel="h3"
            validation
            className="margin-bottom-3"
          >
            <ul className="usa-list margin-top-1 margin-bottom-0">
              {alertMessages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </Alert>
        )}

        <RecommendationFields
          submissionId={submissionId}
          namePrefix={namePrefix}
          generalCommentDefaultValue={
            isMultipleSubmissions ? undefined : initialDetail?.general_comment
          }
          recommendationType={recommendationType}
          hasException={hasException}
          exceptionDetail={exceptionDetail}
          onRecommendationTypeChange={setRecommendationType}
          onHasExceptionChange={setHasException}
          onExceptionDetailChange={setExceptionDetail}
          errors={errors}
        />

        {isMultipleSubmissions ? (
          <FundingSectionMultiple
            submissions={submissions}
            recommendedAmounts={recommendedAmounts}
            onRecommendedAmountChange={(id, value) =>
              setRecommendedAmounts((prev) => ({ ...prev, [id]: value }))
            }
            amountErrors={errors.recommendedAmounts}
          />
        ) : (
          <FundingSectionSingle
            submission={singleSubmission!}
            recommendedAmount={singleRecommendedAmount}
            onRecommendedAmountChange={setSingleRecommendedAmount}
            error={errors.recommendedAmount}
          />
        )}
      </div>
    );
  },
);

export const RecommendationDetailsSection = forwardRef(
  function RecommendationDetailsSection(
    {
      submission,
    }: {
      submission: AwardRecommendationSubmission;
    },
    ref: ForwardedRef<RecommendationDetailFormHandle>,
  ) {
    const t = useTranslations("AwardRecommendation.recommendationDetails");

    return (
      <div>
        <Grid row className="grid-gap">
          <Grid col={9} tablet={{ col: 9 }}>
            <div className="margin-top-3 margin-bottom-3">
              <h2 className="margin-top-0 margin-bottom-2">{t("heading")}</h2>
              <RecommendationDetailForm submission={submission} ref={ref} />
            </div>
          </Grid>
        </Grid>
      </div>
    );
  },
);
