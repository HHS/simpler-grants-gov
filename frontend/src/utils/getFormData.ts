import { RJSFSchema } from "@rjsf/utils";
import { ApiRequestError, parseErrorStatus } from "src/errors";
import { getSession } from "src/services/auth/session";
import { getApplicationFormDetails } from "src/services/fetch/fetchers/applicationFetcher";
import {
  ApplicationFormDetail,
  ApplicationResponseDetail,
} from "src/types/applicationResponseTypes";
import { Attachment } from "src/types/attachmentTypes";
import { FormDetail } from "src/types/formResponseTypes";

import {
  FormValidationWarning,
  UiSchema,
} from "src/components/applyForm/types";
import { processFormSchema } from "src/components/applyForm/utils";
import { validateUiSchema } from "src/components/applyForm/validate";

// either return error or data, not both
type FormDataResult =
  | { error: "TopLevelError" | "NotFound" | "UnauthorizedError"; data?: never }
  | {
      error?: never;
      data: {
        applicationResponse: ApplicationResponseDetail;
        applicationName: string;
        formId: string;
        formName: string;
        formSchema: RJSFSchema;
        formUiSchema: UiSchema;
        formValidationWarnings: FormValidationWarning[] | null;
        applicationAttachments: Attachment[];
      };
    };

/*
  fetches application form data
  validates ui schema
  formats / processes form schema
  returns all relevant data
*/

export default async function getFormData({
  applicationId,
  appFormId,
  internalToken,
}: {
  applicationId: string;
  appFormId: string;
  internalToken?: string;
}): Promise<FormDataResult> {
  let applicationFormData = {} as ApplicationFormDetail;
  let formValidationWarnings: FormValidationWarning[] | null;
  let formData: FormDetail | null;
  const useInternalToken = !!internalToken;
  let sessionToken = "";

  // API can take either internal token or session token to auth
  if (internalToken) sessionToken = internalToken;
  else {
    const session = await getSession();

    if (!session || !session.token) {
      console.error("No active session to access form");
      return { error: "UnauthorizedError" };
    }
    sessionToken = session.token;
  }

  try {
    const response = await getApplicationFormDetails(
      sessionToken,
      applicationId,
      appFormId,
      useInternalToken,
    );

    if (response.status_code !== 200) {
      console.error(
        `Error retrieving form details for applicationID (${applicationId}), appFormId (${appFormId})`,
        response,
      );
      return { error: "TopLevelError" };
    }

    applicationFormData = response.data;
    formData = applicationFormData.form;
    if (!formData) {
      console.error(
        `No form data found for applicationID (${applicationId}), appFormId (${appFormId}))`,
      );
      return { error: "TopLevelError" };
    }

    if (applicationFormData.application_form_id !== appFormId) {
      console.error(
        `Application form ids do not match: ${applicationFormData.application_form_id} & ${appFormId}`,
      );
      return { error: "TopLevelError" };
    }
    formValidationWarnings =
      (response.warnings as unknown as FormValidationWarning[]) || null;
  } catch (e) {
    if (parseErrorStatus(e as ApiRequestError) === 404) {
      console.error(
        `Error retrieving application details for applicationID (${applicationId}), appFormId ${appFormId}:`,
        e,
      );
      return { error: "NotFound" };
    }
    return { error: "TopLevelError" };
  }

  const applicationResponse = applicationFormData.application_response || {};

  const {
    form_id: formId,
    form_name: formName,
    form_json_schema,
    form_ui_schema: formUiSchema,
  } = formData;
  const schemaErrors = validateUiSchema(formUiSchema);
  if (schemaErrors) {
    console.error(
      `Error validating form ui schema for form id: ${formId}`,
      formUiSchema,
      schemaErrors,
    );
    return { error: "TopLevelError" };
  }

  try {
    const result = await processFormSchema(form_json_schema);
    return {
      data: {
        applicationAttachments: applicationFormData.application_attachments,
        applicationResponse,
        applicationName: applicationFormData.application_name,
        formId,
        formName,
        formSchema: result.formSchema,
        formUiSchema,
        formValidationWarnings,
      },
    };
  } catch (e) {
    console.error(`Error parsing JSON schema for form id: ${formId}`, e);
    return { error: "TopLevelError" };
  }
}
