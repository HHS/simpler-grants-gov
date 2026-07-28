"use server";

import { ApiRequestError, parseErrorStatus } from "src/errors";
import {
  createOpportunitySummaryForGrantor,
  updateOpportunitySummaryForGrantor,
} from "src/services/fetch/fetchers/opportunitySummaryGrantorFetcher";
import { OpportunitySummaryUpdateRawData } from "src/types/opportunity/opportunityResponseTypes";
import { getConfiguredDayJs } from "src/utils/dateUtil";
import { formDataToObject } from "src/utils/formData/formDataToJson";
import { z } from "zod";

import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export type OpportunityEditValidationErrors = {
  opportunity_title?: string[];
  category?: string[];
  summary_description?: string[];
  post_date?: string[];
  close_date?: string[];
  agency_email_address?: string[];
  agency_email_address_description?: string[];
  award_floor?: string[];
  award_ceiling?: string[];
  funding_instruments?: string[];
  funding_categories?: string[];
  expected_number_of_awards?: string[];
  estimated_total_program_funding?: string[];
  applicant_types?: string[];
  applicant_eligibility_description?: string[];
  additional_info_url?: string[];
  additional_info_url_description?: string[];
  agency_contact_description?: string[];
};

export type OpportunityEditActionState = {
  errorMessage?: string;
  successMessage?: string;
  validationErrors?: OpportunityEditValidationErrors;
  newOpportunitySummaryId?: string;
};

const editOpportunityFormSchema = {
  opportunity_id: { type: "string" },
  opportunity_summary_id: { type: "string" },
  is_forecast: { type: "boolean" },
  opportunity_title: { type: "string" },
  category: { type: "string" },
  is_cost_sharing: { type: "boolean" },
  expected_number_of_awards: { type: "number" },
  estimated_total_program_funding: { type: "number" },
  award_floor: { type: "number" },
  award_ceiling: { type: "number" },
  post_date: { type: "string" },
  close_date: { type: "string" },
  close_date_description: { type: "string" },
  funding_instruments: { type: "string" },
  funding_categories: { type: "string" },
  applicant_types: { items: { type: "string" } }, // array
  summary_description: { type: "string" },
  additional_info_url: { type: "string" },
  additional_info_url_description: { type: "string" },
  agency_contact_description: { type: "string" },
  agency_email_address: { type: "string" },
  agency_email_address_description: { type: "string" },
  "opportunity-attachment-upload": { type: "File" },
  submitType: { type: "string" },
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
      opportunity_title: z.string().trim(),
      category: z.string().trim(),
      summary_description: z.string().trim(),
      post_date: z
        .string()
        .trim()
        .min(1, { message: validationErrors("publishDate") }),
      close_date: z.string().trim(),
      agency_email_address: z
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
      agency_email_address_description: z.string().trim(),
      funding_instruments: z
        .string()
        .trim()
        .min(1, { message: validationErrors("fundingType") }),
      funding_categories: z
        .string()
        .trim()
        .min(1, { message: validationErrors("fundingCategory") }),
      expected_number_of_awards: z.string().trim(),
      estimated_total_program_funding: z.string().trim(),
      award_ceiling: z.string().trim(),
      award_floor: z.string().trim(),
      applicant_types: z
        .array(z.string())
        .min(1, { message: validationErrors("eligibleApplicants") }),
      applicant_eligibility_description: z.string().trim(),
      additional_info_url: z.string().trim(),
      additional_info_url_description: z.string().trim(),
      agency_contact_description: z.string().trim(),
    })
    .superRefine(({ post_date, close_date }, ctx) => {
      if (!post_date || !close_date) {
        return;
      }

      const dayjs = getConfiguredDayJs();
      const close = dayjs(close_date, "YYYY-MM-DD", true);
      const publish = dayjs(post_date, "YYYY-MM-DD", true);

      if (!close.isValid() || !publish.isValid() || close.isBefore(publish)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["closeDate"],
          message: validationErrors("closeDateOrder"),
        });
      }
    })
    .superRefine(
      (
        { award_floor, award_ceiling, estimated_total_program_funding },
        ctx,
      ) => {
        const min = Number(award_floor.replace(/,/g, ""));
        const max = Number(award_ceiling.replace(/,/g, ""));
        const total = Number(estimated_total_program_funding.replace(/,/g, ""));
        // Award Minimum cannot exceed the Estimated Total Program Funding.
        if (
          award_floor &&
          estimated_total_program_funding &&
          !isNaN(min) &&
          !isNaN(total) &&
          min > total
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["award_floor"],
            message: validationErrors("awardMinLessThanTotal"),
          });
        }
        // Award Maximum cannot exceed the Estimated Total Program Funding.
        if (
          award_ceiling &&
          estimated_total_program_funding &&
          !isNaN(max) &&
          !isNaN(total) &&
          max > total
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["award_ceiling"],
            message: validationErrors("awardMaxLessThanTotal"),
          });
        }
        // Award Minimum cannot exceed Award Maximum.
        if (
          award_floor &&
          award_ceiling &&
          !isNaN(min) &&
          !isNaN(max) &&
          min > max
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["award_floor"],
            message: validationErrors("awardMinLessThanMax"),
          });
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["award_ceiling"],
            message: validationErrors("awardMaxGreaterThanMin"),
          });
        }
      },
    );
  const applicantTypeKeys = Array.from(
    formData.keys().filter((key) => key.includes("applicant_types[")),
  );
  return reviewOpportunityEditSchema.safeParse({
    opportunity_title: readStringValue(formData.get("opportunity_title")),
    category: readStringValue(formData.get("category")),
    summary_description: readStringValue(formData.get("summary_description")),
    post_date: readStringValue(formData.get("post_date")),
    close_date: readStringValue(formData.get("close_date")),
    agency_email_address: readStringValue(formData.get("agency_email_address")),
    agency_email_address_description: readStringValue(
      formData.get("agency_email_address_description"),
    ),
    award_floor: readStringValue(formData.get("award_floor")),
    award_ceiling: readStringValue(formData.get("award_ceiling")),
    funding_instruments: readStringValue(formData.get("funding_instruments")),
    funding_categories: readStringValue(formData.get("funding_categories")),
    expected_number_of_awards: readStringValue(
      formData.get("expected_number_of_awards"),
    ),
    estimated_total_program_funding: readStringValue(
      formData.get("estimated_total_program_funding"),
    ),
    applicant_types: applicantTypeKeys.map(
      (key) => formData.get(key) as string,
    ),
    applicant_eligibility_description: readStringValue(
      formData.get("applicant_eligibility_description"),
    ),
    additional_info_url: readStringValue(formData.get("additional_info_url")),
    additional_info_url_description: readStringValue(
      formData.get("additional_info_url_description"),
    ),
    agency_contact_description: readStringValue(
      formData.get("agency_contact_description"),
    ),
  });
}

export async function saveOpportunityEditAction(
  _prevState: OpportunityEditActionState,
  formData: FormData,
): Promise<OpportunityEditActionState> {
  const alerts = await getTranslations("OpportunityEdit.content.alerts");

  const opportunityId = readStringValue(formData.get("opportunity_id")).trim();
  const opportunitySummaryId = readStringValue(
    formData.get("opportunity_summary_id"),
  ).trim();
  const isForecast =
    readStringValue(formData.get("is_forecast")).trim() === "true";

  if (!opportunityId) {
    return {
      errorMessage: alerts("missingSummaryContext"),
    };
  }

  const validatedFields = await validateOpportunityEditForm(formData);

  if (!validatedFields.success) {
    return {
      validationErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    if (!opportunitySummaryId) {
      const rawBody = {
        ...formDataToObject<OpportunitySummaryUpdateRawData>(
          formData,
          editOpportunityFormSchema,
          null,
        ),
        is_forecast: isForecast,
      };

      const body = {
        ...rawBody,
        funding_categories: [rawBody.funding_categories],
        funding_instruments: [rawBody.funding_instruments],
      };
      const createResponse = await createOpportunitySummaryForGrantor({
        opportunityId,
        body: body,
      });

      return {
        successMessage: alerts("success"),
        newOpportunitySummaryId: createResponse.data.opportunity_summary_id,
      };
    }

    const rawBody = formDataToObject<OpportunitySummaryUpdateRawData>(
      formData,
      editOpportunityFormSchema,
      null,
    );
    /*
      funding_instruments, funding_categories, applicant_types all need to be arrays of strings

      * funding_instruments, funding_categories are not implemented as multiselects, so they just need to be reformatted
      * applicant_types is handled via hidden inputs for collecting values
    */

    const body = {
      ...rawBody,
      funding_categories: [rawBody.funding_categories],
      funding_instruments: [rawBody.funding_instruments],
    };

    const response = await updateOpportunitySummaryForGrantor({
      opportunityId,
      opportunitySummaryId,
      body,
    });
    if (response.status_code === 422) {
      console.error("API side validation errors:", response.errors);
      throw new ApiRequestError(
        "API side validation errors",
        "validation",
        422,
      );
    }
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

  const submitType = formData.get("submitType");
  if (submitType === "saveAndExit") {
    redirect("../overview");
  } else if (submitType === "saveAndGoBack") {
    redirect("../overview");
  } else if (submitType === "saveAndContinue") {
    redirect("../competition");
  } else {
    return saveResult;
  }
}
