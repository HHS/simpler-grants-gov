"use server";

import { ApiRequestError, parseErrorStatus } from "src/errors";
import { OpportunitySummaryCreateRequestV1Schema } from "src/generated/apiSchemas.zod";
import {
  createOpportunitySummaryForGrantor,
  updateOpportunitySummaryForGrantor,
} from "src/services/fetch/fetchers/grantorOpportunitiesFetcher";
import { OpportunitySummaryCreateRequest } from "src/types/opportunity/opportunityResponseTypes";
import { getOpportunitySummaryValidationData } from "src/utils/validation/opportunitySummaryValidation";
import {
  getZodValidationErrors,
  mapApiValidationErrors,
} from "src/utils/validation/zodValidation";
import type { z } from "zod";

import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export type OpportunityEditValidationErrors = Partial<
  Record<
    keyof z.input<typeof OpportunitySummaryCreateRequestV1Schema>,
    string[]
  >
>;

export type OpportunityEditActionState = {
  errorMessage?: string;
  successMessage?: string;
  validationErrors?: OpportunityEditValidationErrors;
  newOpportunitySummaryId?: string;
};

function toOpportunitySummaryRequest(
  data: z.output<typeof OpportunitySummaryCreateRequestV1Schema>,
): OpportunitySummaryCreateRequest {
  return {
    ...data,
    close_date: data.close_date ?? null,
    close_date_description: data.close_date_description ?? null,
    expected_number_of_awards: data.expected_number_of_awards ?? null,
    estimated_total_program_funding:
      data.estimated_total_program_funding ?? null,
    additional_info_url: data.additional_info_url ?? null,
    additional_info_url_description:
      data.additional_info_url_description ?? null,
    funding_category_description: data.funding_category_description ?? null,
    applicant_eligibility_description:
      data.applicant_eligibility_description ?? null,
  };
}

export async function saveOpportunityEditAction(
  _prevState: OpportunityEditActionState,
  formData: FormData,
): Promise<OpportunityEditActionState> {
  const [alerts, fieldTranslations, genericTranslations] = await Promise.all([
    getTranslations("OpportunityEdit.content.alerts"),
    getTranslations("OpportunityEdit.validationErrors"),
    getTranslations("genericValidationMessages"),
  ]);

  const opportunityIdValue = formData.get("opportunity_id");
  const opportunitySummaryIdValue = formData.get("opportunity_summary_id");

  const opportunityId =
    typeof opportunityIdValue === "string" ? opportunityIdValue.trim() : "";

  const opportunitySummaryId =
    typeof opportunitySummaryIdValue === "string"
      ? opportunitySummaryIdValue.trim()
      : "";

  if (!opportunityId) {
    return {
      errorMessage: alerts("missingSummaryContext"),
    };
  }

  const validationData = getOpportunitySummaryValidationData(formData);

  const validatedFields =
    OpportunitySummaryCreateRequestV1Schema.safeParse(validationData);

  if (!validatedFields.success) {
    return {
      validationErrors: getZodValidationErrors(
        validatedFields.error,
        validationData,
        OpportunitySummaryCreateRequestV1Schema,
        fieldTranslations,
        genericTranslations,
      ),
    };
  }

  const body = toOpportunitySummaryRequest(validatedFields.data);

  try {
    if (!opportunitySummaryId) {
      const createResponse = await createOpportunitySummaryForGrantor({
        opportunityId,
        body,
      });

      if (createResponse.status_code === 422) {
        return mapApiValidationErrors(
          createResponse,
          OpportunitySummaryCreateRequestV1Schema,
          fieldTranslations,
          genericTranslations,
          alerts("genericError"),
        );
      }

      return {
        successMessage: alerts("success"),
        newOpportunitySummaryId: createResponse.data.opportunity_summary_id,
      };
    }

    const response = await updateOpportunitySummaryForGrantor({
      opportunityId,
      opportunitySummaryId,
      body,
    });

    if (response.status_code === 422) {
      return mapApiValidationErrors(
        response,
        OpportunitySummaryCreateRequestV1Schema,
        fieldTranslations,
        genericTranslations,
        alerts("genericError"),
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

    return {
      errorMessage: alerts("genericError"),
    };
  }
}
export async function opportunityEditFormAction(
  prevState: OpportunityEditActionState,
  formData: FormData,
): Promise<OpportunityEditActionState> {
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
