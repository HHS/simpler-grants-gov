"use server";

import { ApiRequestError, parseErrorStatus } from "src/errors";
import {
  createOpportunitySummaryForGrantor,
  updateOpportunitySummaryForGrantor,
} from "src/services/fetch/fetchers/opportunitySummaryGrantorFetcher";
import { getConfiguredDayJs } from "src/utils/dateUtil";
import { buildOpportunitySummaryUpdateRequest } from "src/utils/opportunityEditFormConfig";
import { z } from "zod";

import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export type OpportunityEditValidationErrors = {
  title?: string[];
  awardSelectionMethod?: string[];
  description?: string[];
  publishDate?: string[];
  closeDate?: string[];
  contactEmail?: string[];
  contactEmailText?: string[];
  awardMinimum?: string[];
  awardMaximum?: string[];
  fundingType?: string[];
  fundingCategory?: string[];
  expectedNumberOfAwards?: string[];
  estimatedTotalProgramFunding?: string[];
  eligibleApplicants?: string[];
  additionalEligibilityInfo?: string[];
  additionalInfoUrl?: string[];
  additionalInfoUrlText?: string[];
  grantorContactDetails?: string[];
};

export type OpportunityEditActionState = {
  errorMessage?: string;
  successMessage?: string;
  validationErrors?: OpportunityEditValidationErrors;
  newOpportunitySummaryId?: string;
};

function readStringValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

async function validateOpportunityEditForm(formData: FormData) {
  const validationErrors = await getTranslations(
    "OpportunityEdit.validationErrors",
  );
  const reviewOpportunityEditSchema = z
    .object({
      title: z.string().trim(),
      awardSelectionMethod: z.string().trim(),
      description: z.string().trim(),
      publishDate: z
        .string()
        .trim()
        .min(1, { message: validationErrors("publishDate") }),
      closeDate: z.string().trim(),
      contactEmail: z
        .string()
        .trim()
        .superRefine((value, ctx) => {
          if (value && !z.string().email().safeParse(value).success) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: validationErrors("contactEmailInvalid"),
            });
          }
        }),
      contactEmailText: z.string().trim(),
      fundingType: z
        .string()
        .trim()
        .min(1, { message: validationErrors("fundingType") }),
      fundingCategory: z
        .string()
        .trim()
        .min(1, { message: validationErrors("fundingCategory") }),
      expectedNumberOfAwards: z.string().trim(),
      estimatedTotalProgramFunding: z.string().trim(),
      awardMinimum: z.string().trim(),
      awardMaximum: z.string().trim(),
      eligibleApplicants: z
        .array(z.string())
        .min(1, { message: validationErrors("eligibleApplicants") }),
      additionalEligibilityInfo: z.string().trim(),
      additionalInfoUrl: z.string().trim(),
      additionalInfoUrlText: z.string().trim(),
      grantorContactDetails: z.string().trim(),
    })
    .superRefine(({ publishDate, closeDate }, ctx) => {
      if (!publishDate || !closeDate) {
        return;
      }

      const dayjs = getConfiguredDayJs();
      const close = dayjs(closeDate, "YYYY-MM-DD", true);
      const publish = dayjs(publishDate, "YYYY-MM-DD", true);

      if (!close.isValid() || !publish.isValid() || close.isBefore(publish)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["closeDate"],
          message: validationErrors("closeDateOrder"),
        });
      }
    })
    .superRefine(
      ({ awardMinimum, awardMaximum, estimatedTotalProgramFunding }, ctx) => {
        const min = Number(awardMinimum.replace(/,/g, ""));
        const max = Number(awardMaximum.replace(/,/g, ""));
        const total = Number(estimatedTotalProgramFunding.replace(/,/g, ""));
        // Award Minimum cannot exceed the Estimated Total Program Funding.
        if (
          awardMinimum &&
          estimatedTotalProgramFunding &&
          !isNaN(min) &&
          !isNaN(total) &&
          min > total
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["awardMinimum"],
            message: validationErrors("awardMinLessThanTotal"),
          });
        }
        // Award Maximum cannot exceed the Estimated Total Program Funding.
        if (
          awardMaximum &&
          estimatedTotalProgramFunding &&
          !isNaN(max) &&
          !isNaN(total) &&
          max > total
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["awardMaximum"],
            message: validationErrors("awardMaxLessThanTotal"),
          });
        }
        // Award Minimum cannot exceed Award Maximum.
        if (
          awardMinimum &&
          awardMaximum &&
          !isNaN(min) &&
          !isNaN(max) &&
          min > max
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["awardMinimum"],
            message: validationErrors("awardMinLessThanMax"),
          });
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["awardMaximum"],
            message: validationErrors("awardMaxGreaterThanMin"),
          });
        }
      },
    );

  return reviewOpportunityEditSchema.safeParse({
    title: readStringValue(formData.get("title")),
    awardSelectionMethod: readStringValue(formData.get("awardSelectionMethod")),
    description: readStringValue(formData.get("description")),
    publishDate: readStringValue(formData.get("publishDate")),
    closeDate: readStringValue(formData.get("closeDate")),
    contactEmail: readStringValue(formData.get("contactEmail")),
    contactEmailText: readStringValue(formData.get("contactEmailText")),
    awardMinimum: readStringValue(formData.get("awardMinimum")),
    awardMaximum: readStringValue(formData.get("awardMaximum")),
    fundingType: readStringValue(formData.get("funding-type-values")),
    fundingCategory: readStringValue(formData.get("funding-category-values")),
    expectedNumberOfAwards: readStringValue(
      formData.get("expectedNumberOfAwards"),
    ),
    estimatedTotalProgramFunding: readStringValue(
      formData.get("estimatedTotalProgramFunding"),
    ),
    eligibleApplicants: formData.getAll("eligibleApplicants") as string[],
    additionalEligibilityInfo: readStringValue(
      formData.get("additionalEligibilityInfo"),
    ),
    additionalInfoUrl: readStringValue(formData.get("additionalInfoUrl")),
    additionalInfoUrlText: readStringValue(
      formData.get("additionalInfoUrlText"),
    ),
    grantorContactDetails: readStringValue(
      formData.get("grantorContactDetails"),
    ),
  });
}

export async function saveOpportunityEditAction(
  _prevState: OpportunityEditActionState,
  formData: FormData,
): Promise<OpportunityEditActionState> {
  const alerts = await getTranslations("OpportunityEdit.content.alerts");

  const opportunityId = readStringValue(formData.get("opportunityId")).trim();
  const opportunitySummaryId = readStringValue(
    formData.get("opportunitySummaryId"),
  ).trim();
  const isForecast =
    readStringValue(formData.get("isForecast")).trim() === "true";

  if (!opportunityId) {
    return {
      errorMessage: alerts("missingSummaryContext"),
    };
  }

  const validatedFields = await validateOpportunityEditForm(formData);

  if (!validatedFields.success) {
    return {
      validationErrors: validatedFields.error.flatten()
        .fieldErrors as OpportunityEditValidationErrors,
    };
  }

  try {
    if (!opportunitySummaryId) {
      const createResponse = await createOpportunitySummaryForGrantor({
        opportunityId,
        body: {
          ...buildOpportunitySummaryUpdateRequest(formData),
          is_forecast: isForecast,
        },
      });

      return {
        successMessage: alerts("success"),
        newOpportunitySummaryId: createResponse.data.opportunity_summary_id,
      };
    }

    await updateOpportunitySummaryForGrantor({
      opportunityId,
      opportunitySummaryId,
      body: buildOpportunitySummaryUpdateRequest(formData),
    });

    return {
      successMessage: alerts("success"),
    };
  } catch (error) {
    const status =
      error instanceof ApiRequestError ? parseErrorStatus(error) : null;

    if (status === 401) {
      return {
        errorMessage: alerts("unauthenticated"),
      };
    }

    if (status === 403) {
      return {
        errorMessage: alerts("forbidden"),
      };
    }

    if (status === 404) {
      return {
        errorMessage: alerts("notFound"),
      };
    }

    if (status === 422) {
      return {
        errorMessage: alerts("draftOnly"),
      };
    }

    return {
      errorMessage: alerts("genericError"),
    };
  }
}

export async function opportunityEditFormAction(
  prevState: OpportunityEditActionState,
  formData: FormData,
): Promise<OpportunityEditActionState> {
  // Save the form first - if there are validation or API errors, display them.
  const saveResult = await saveOpportunityEditAction(prevState, formData);
  const hasValidationErrors =
    saveResult.validationErrors &&
    Object.keys(saveResult.validationErrors).length > 0;
  if (saveResult.errorMessage || hasValidationErrors) {
    return saveResult;
  }

  if (readStringValue(formData.get("submitType")) === "saveAndExit") {
    redirect("../overview");
  } else if (readStringValue(formData.get("submitType")) === "saveAndGoBack") {
    redirect("../overview");
  } else if (
    readStringValue(formData.get("submitType")) === "saveAndContinue"
  ) {
    redirect("../competition");
  } else {
    return saveResult;
  }
}
