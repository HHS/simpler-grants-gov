"use server";

import { RJSFSchema } from "@rjsf/utils";
import { ErrorObject } from "ajv";
import { handleUpdateApplicationForm } from "src/services/fetch/fetchers/applicationFetcher";
import { getFormDetails } from "src/services/fetch/fetchers/formsFetcher";
import { ApplicationResponseDetail } from "src/types/applicationResponseTypes";
import { FormDetail } from "src/types/formResponseTypes";

import { redirect } from "next/navigation";

import { shapeFormData } from "./utils";
import { validateFormData } from "./validate";

type applyFormErrors = {
  errorMessage: string;
  validationErrors: ErrorObject<string, Record<string, unknown>, unknown>[];
};
type applyFormResponse = {
  applicationId: string;
  formData: object;
  formId: string;
  successMessage: string;
};

export async function submitApplyForm(
  _prevState: applyFormResponse & applyFormErrors,
  formData: FormData,
) {
  const { formId, applicationId, successMessage } = _prevState;
  const formDetails = await fetchForm(formId);
  if (!formDetails) {
    return {
      applicationId,
      errorMessage: "Error submitting form",
      formData,
      formId,
      successMessage,
      validationErrors: [],
    };
  }
  const { form_json_schema } = formDetails;
  const { validationErrors, errorMessage } = formValidate({
    formData,
    formSchema: form_json_schema,
  });
  if (validationErrors.length) {
    return {
      applicationId,
      errorMessage,
      formData,
      formId,
      successMessage,
      validationErrors,
    };
  } else {
    const applicationFormData = shapeFormData<ApplicationResponseDetail>(
      formData,
      form_json_schema,
    );

    const saveSuccess = await handleSave(
      applicationFormData,
      applicationId,
      formId,
    );
    if (saveSuccess) {
      if (formData.get("apply-form-button") === "submit") {
        redirect(`/formPrototype/success`);
      } else {
        return {
          applicationId,
          errorMessage,
          formData,
          formId,
          successMessage: "Form saved",
          validationErrors,
        };
      }
    }
    return {
      applicationId,
      errorMessage: "Error saving the form",
      formData,
      formId,
      successMessage,
      validationErrors,
    };
  }
}

const handleSave = async (
  applicationFormData: ApplicationResponseDetail,
  applicationId: string,
  formId: string,
) => {
  try {
    const resp = await handleUpdateApplicationForm(
      applicationFormData,
      applicationId,
      formId,
    );
    if (resp.status_code === 200) {
      return true;
    }
    return false;
  } catch (e) {
    console.error(
      `Error saving the form (${formId}) for application (${applicationId}):`,
      e,
    );
    return false;
  }
};

async function fetchForm(formId: string): Promise<FormDetail> {
  let formSchema = <FormDetail>{};
  try {
    const response = await getFormDetails(formId);
    if (response.status_code !== 200) {
      console.error(
        `Error retrieving form details for formID (${formId})`,
        response,
      );
    }
    formSchema = response.data;
  } catch (e) {
    console.error(`Error retrieving form details for formID (${formId})`, e);
  }
  return formSchema;
}

function formValidate({
  formData,
  formSchema,
}: {
  formData: FormData;
  formSchema: RJSFSchema;
}): applyFormErrors {
  const errors = validateFormData(formData, formSchema);
  if (errors) {
    return {
      errorMessage: "Error submitting form",
      validationErrors: errors,
    };
  } else {
    return {
      errorMessage: "",
      validationErrors: [],
    };
  }
}
