"use server";

import $RefParser from "@apidevtools/json-schema-ref-parser";
import { RJSFSchema } from "@rjsf/utils";
import { getSession } from "src/services/auth/session";
import { handleUpdateApplicationForm } from "src/services/fetch/fetchers/applicationFetcher";
import { getFormDetails } from "src/services/fetch/fetchers/formsFetcher";
import { ApplicationResponseDetail } from "src/types/applicationResponseTypes";
import { FormDetail } from "src/types/formResponseTypes";

import { shapeFormData } from "./utils";

type ApplyFormResponse = {
  applicationId: string;
  error: boolean;
  formData: object;
  formId: string;
  saved: boolean;
};

export async function handleFormAction(
  _prevState: ApplyFormResponse,
  formData: FormData,
) {
  const { formId, applicationId } = _prevState;
  const session = await getSession();
  if (!session || !session.token) {
    return {
      applicationId,
      error: true,
      formData,
      formId,
      saved: true,
    };
  }

  const formSchema = await getFormSchema(formId);
  if (!formSchema) {
    return {
      applicationId,
      error: true,
      formData,
      formId,
      saved: true,
    };
  }
  const applicationFormData = shapeFormData<ApplicationResponseDetail>(
    formData,
    formSchema,
  );

  const saveSuccess = await handleSave(
    applicationFormData,
    applicationId,
    formId,
    session.token,
  );
  if (saveSuccess) {
    return {
      applicationId,
      error: false,
      formData: applicationFormData,
      formId,
      saved: true,
    };
  } else {
    return {
      applicationId,
      error: true,
      formData,
      formId,
      saved: true,
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
