"use server";

import { ErrorObject } from "ajv";
import { handleUpdateApplicationForm } from "src/services/fetch/fetchers/applicationFetcher";
import { getFormDetails } from "src/services/fetch/fetchers/formsFetcher";
import { ApplicationResponseDetail } from "src/types/applicationResponseTypes";
import { FormDetail } from "src/types/formResponseTypes";

import { redirect } from "next/navigation";

import { filterFormData } from "./utils";
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
  const { validationErrors, errorMessage } = await formValidate({
    formData,
    formId,
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
    const applicationFormData =
      filterFormData<ApplicationResponseDetail>(formData);

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

async function formValidate({
  formData,
  formId,
}: {
  formData: FormData;
  formId: string;
}): Promise<applyFormErrors> {
  let formSchema = <FormDetail>{};
  try {
    const response = await getFormDetails(formId);
    if (response.status_code !== 200) {
      console.error(
        `Error retrieving form details for formID (${formId})`,
        response,
      );
      return {
        errorMessage: "Error submitting form",
        validationErrors: [],
      };
    }
    formSchema = response.data;
  } catch (e) {
    console.error(`Error retrieving form details for formID (${formId})`, e);
    return {
      errorMessage: "Error submitting form",
      validationErrors: [],
    };
  }

  const errors = validateFormData(formData, formSchema.form_json_schema);
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
