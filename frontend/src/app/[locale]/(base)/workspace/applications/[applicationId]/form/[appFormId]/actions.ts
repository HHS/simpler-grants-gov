"use server";

import { RJSFSchema } from "@rjsf/utils";
import { getSession } from "src/services/auth/session";
import { handleUpdateApplicationForm } from "src/services/fetch/fetchers/applicationFetcher";
import { getFormDetails } from "src/services/fetch/fetchers/formsFetcher";
import { logger } from "src/services/logger/simplerLogger";
import { ApplicationResponseDetail } from "src/types/applicationResponseTypes";
import { FormDetail } from "src/types/formResponseTypes";
import {
  processFormSchema,
  shapeFormData,
} from "src/utils/applyForm/applyFormUtils";

type ApplyFormResponse = {
  applicationId: string;
  error: boolean;
  formData: object;
  formId: string;
  saved: boolean;
};

export async function handleFormAction(
  prevState: ApplyFormResponse,
  formData: FormData,
) {
  const { formId, applicationId } = prevState;
  const session = await getSession();
  if (!session || !session.token) {
    return {
      applicationId,
      error: true,
      formData,
      formId,
      saved: false,
    };
  }

  const formSchema = await getFormSchema(formId);
  if (!formSchema) {
    return {
      applicationId,
      error: true,
      formData,
      formId,
      saved: false,
    };
  }

  // this generic typing isn't correct - we'll end up with a nested object
  const applicationFormData = shapeFormData<ApplicationResponseDetail>(
    formData,
    formSchema,
  );

  const saveSuccess = await handleSave(
    applicationFormData,
    applicationId,
    formId,
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
      saved: false,
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
    logger.error(
      { err: e, formId, applicationId },
      "Error saving the form for application",
    );
    return false;
  }
};

// get and process the form schema, which is then used to determing proper typing for save form payload data
async function getFormSchema(formId: string): Promise<RJSFSchema | undefined> {
  let formDetail = <FormDetail>{};
  try {
    const response = await getFormDetails(formId);
    if (response.status_code !== 200) {
      logger.error(
        { statusCode: response.status_code, formId },
        "Error retrieving form details",
      );
    }
    formDetail = response.data;
  } catch (e) {
    logger.error({ err: e, formId }, "Error retrieving form details");
  }
  try {
    const { formSchema } = processFormSchema(formDetail.form_json_schema);
    return formSchema;
  } catch (e) {
    logger.error({ err: e, formId }, "Error parsing JSON schema");
    return undefined;
  }
}
