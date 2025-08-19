import { RJSFSchema } from "@rjsf/utils";
import {
  ApiRequestError,
  parseErrorStatus,
  UnauthorizedError,
} from "src/errors";
import { getSession } from "src/services/auth/session";
import { getApplicationFormDetails } from "src/services/fetch/fetchers/applicationFetcher";
import {
  ApplicationFormDetail,
  ApplicationResponseDetail,
} from "src/types/applicationResponseTypes";
import { FormDetail } from "src/types/formResponseTypes";

import {
  FormValidationWarning,
  UiSchema,
} from "src/components/applyForm/types";
import { processFormSchema } from "src/components/applyForm/utils";
import { validateUiSchema } from "src/components/applyForm/validate";

export const dynamic = "force-dynamic";

type formDataResult =
  | { error: "TopLevelError" | "NotFound"; data?: never }
  | {
      error?: never;
      data: {
        applicationResponse: ApplicationResponseDetail;
        applicationFormData: ApplicationFormDetail;
        formId: string;
        formName: string;
        formSchema: RJSFSchema;
        formUiSchema: UiSchema;
        formValidationWarnings: FormValidationWarning[] | null;
      };
    };

export default async function getFormData({
  applicationId,
  appFormId,
  internalToken,
}: {
  applicationId: string;
  appFormId: string;
  internalToken?: string;
}): Promise<formDataResult> {
  let applicationFormData = {} as ApplicationFormDetail;
  let formValidationWarnings: FormValidationWarning[] | null;
  let formData: FormDetail | null;
  const session = await getSession();

  if (!session || !session.token) {
    throw new UnauthorizedError("No active session to access form");
  }

  try {
    const response = await getApplicationFormDetails(
      session.token,
      applicationId,
      appFormId,
      internalToken,
    );

    if (response.status_code !== 200) {
      console.error(
        `Error retrieving form details for applicationID (${applicationId}), appFormId (${appFormId})`,
        response,
      );
      return { error: "TopLevelError" };
    }

    applicationFormData = response.data;
    formData = response.data.form;
    if (!formData) {
      console.error(
        `No form data found for applicationID (${applicationId}), appFormId (${appFormId}))`,
      );
      return { error: "TopLevelError" };
    }

    if (applicationFormData.application_form_id !== appFormId) {
      console.error(`Application form ids to do not match`);
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
      "Error validating form ui schema",
      formUiSchema,
      schemaErrors,
    );
    return { error: "TopLevelError" };
  }

  let formSchema = {};
  try {
    // creates single object for json schema from references
    formSchema = await processFormSchema(form_json_schema);
  } catch (e) {
    console.error("Error parsing JSON schema", e);
    return { error: "TopLevelError" };
  }
  return {
    data: {
      applicationResponse,
      applicationFormData,
      formId,
      formName,
      formSchema,
      formUiSchema,
      formValidationWarnings,
    },
  };
}
