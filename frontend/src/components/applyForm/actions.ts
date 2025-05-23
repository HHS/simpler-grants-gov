"use server";

import $RefParser from "@apidevtools/json-schema-ref-parser";
import { RJSFSchema } from "@rjsf/utils";
import { getSession } from "src/services/auth/session";
import { handleUpdateApplicationForm } from "src/services/fetch/fetchers/applicationFetcher";
import { getFormDetails } from "src/services/fetch/fetchers/formsFetcher";
import { ApplicationResponseDetail } from "src/types/applicationResponseTypes";
import { FormDetail } from "src/types/formResponseTypes";

import { redirect } from "next/navigation";

import { FieldErrors } from "./types";
import { shapeFormData } from "./utils";
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
  const session = await getSession();
  if (!session || !session.token) {
    return {
      applicationId,
      errorMessage: "Error submitting form. User not authenticated.",
      formData,
      formId,
      successMessage: "",
      validationErrors: [],
    };
  }
  const sumbitType = formData.get("apply-form-button");

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
    await handleSave(applicationFormData, applicationId, formId, session.token);
    return {
      applicationId,
      errorMessage:
        sumbitType === "save"
          ? "Form validation errors"
          : "Unable to submit due to form validation errors",
      formData: applicationFormData,
      formId,
      successMessage: "Form saved",
      validationErrors,
    };
  } else {
    const saveSuccess = await handleSave(
      applicationFormData,
      applicationId,
      formId,
      session.token,
    );
    if (saveSuccess) {
      if (sumbitType === "submit") {
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
  sessionToken: string,
) => {
  try {
    const resp = await handleUpdateApplicationForm(
      applicationFormData,
      applicationId,
      formId,
      sessionToken,
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
  let formDetail = <FormDetail>{};
  try {
    const response = await getFormDetails(formId);
    if (response.status_code !== 200) {
      console.error(
        `Error retrieving form details for formID (${formId})`,
        response,
      );
    }
    formDetail = response.data;
  } catch (e) {
    console.error(`Error retrieving form details for formID (${formId})`, e);
  }
  let formSchema = {};
  try {
    formSchema = await $RefParser.dereference(formDetail.form_json_schema);
  } catch (e) {
    console.error("Error parsing JSON schema", e);
  }
  return formSchema;
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
      errorMessage: "Form validation errors",
      validationErrors: errors,
    };
  } else {
    return {
      errorMessage: "",
      validationErrors: [],
    };
  }
}
