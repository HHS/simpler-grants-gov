"use server";

import { RJSFSchema } from "@rjsf/utils";
import { handleUpdateApplicationForm } from "src/services/fetch/fetchers/applicationFetcher";
import { getFormDetails } from "src/services/fetch/fetchers/formsFetcher";
import { ApplicationResponseDetail } from "src/types/applicationResponseTypes";
import { FormDetail } from "src/types/formResponseTypes";

import { redirect } from "next/navigation";

import { FieldErrors } from "./types";
import { parseSchema, shapeFormData } from "./utils";
import { validateJsonBySchema } from "./validate";

type applyFormErrors = {
  errorMessage: string;
  validationErrors: FieldErrors;
};
type applyFormResponse = {
  applicationId: string;
  formData: object;
  formId: string;
  successMessage: string;
};

export async function handleFormAction(
  _prevState: applyFormResponse & applyFormErrors,
  formData: FormData,
) {
  const { formId, applicationId, successMessage } = _prevState;

  const formSchema = await getFormSchema(formId);
  if (!formSchema) {
    return {
      applicationId,
      errorMessage: "Error submitting form",
      formData,
      formId,
      successMessage: "",
      validationErrors: [],
    };
  }
  const applicationFormData = shapeFormData<ApplicationResponseDetail>(
    formData,
    formSchema,
  );
  const { validationErrors, errorMessage } = formValidate({
    formData: applicationFormData,
    formSchema,
  });
  if (validationErrors.length) {
    await handleSave(applicationFormData, applicationId, formId);
    return {
      applicationId,
      errorMessage,
      formData: applicationFormData,
      formId,
      successMessage,
      validationErrors,
    };
  } else {
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
          formData: applicationFormData,
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

async function getFormSchema(formId: string): Promise<RJSFSchema | undefined> {
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
  return await parseSchema(formSchema.form_json_schema);
}

function formValidate({
  formData,
  formSchema,
}: {
  formData: ApplicationResponseDetail;
  formSchema: RJSFSchema;
}): applyFormErrors {
  const errors = validateJsonBySchema(formData, formSchema);
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
