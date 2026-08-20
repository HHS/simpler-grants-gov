"use server";

import {
  getOpportunitySummaryValidationData,
  toOpportunitySummaryRequest,
} from "src/app/[locale]/(base)/grantor/opportunity/[id]/edit/opportunitySummaryValidation";
import { ApiRequestError, parseErrorStatus } from "src/errors";
import {
  createOpportunitySummaryForGrantor,
  updateOpportunitySummaryForGrantor,
} from "src/services/fetch/fetchers/grantorOpportunitiesFetcher";
import {
  mapServerApiValidationErrors,
  validateZodFormData,
} from "src/utils/validation/zodServerValidation";
import { OpportunitySummaryCreateRequestV1Schema } from "src/validation-schemas/apiSchemas.zod";
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

export async function saveOpportunityEditAction(
  _prevState: OpportunityEditActionState,
  formData: FormData,
): Promise<OpportunityEditActionState> {
  const [alerts, fieldTranslations] = await Promise.all([
    getTranslations("OpportunityEdit.content.alerts"),
    getTranslations("OpportunityEdit.validationErrors"),
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

  const validation = await validateZodFormData({
    schema: OpportunitySummaryCreateRequestV1Schema,
    formData,
    fieldTranslations,
    getValidationData: getOpportunitySummaryValidationData,
  });

  if (!validation.success) {
    return {
      validationErrors: validation.validationErrors,
    };
  }

  const body = toOpportunitySummaryRequest(validation.data);

  try {
    if (!opportunitySummaryId) {
      const createResponse = await createOpportunitySummaryForGrantor({
        opportunityId,
        body,
      });

      if (createResponse.status_code === 422) {
        return mapServerApiValidationErrors(
          createResponse,
          OpportunitySummaryCreateRequestV1Schema,
          fieldTranslations,
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
      return mapServerApiValidationErrors(
        response,
        OpportunitySummaryCreateRequestV1Schema,
        fieldTranslations,
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
