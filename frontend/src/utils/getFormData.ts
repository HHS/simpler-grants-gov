import { RJSFSchema } from "@rjsf/utils";
import { ErrorObject } from "ajv";
import { ApiRequestError, parseErrorStatus } from "src/errors";
import { getSession } from "src/services/auth/session";
import {
  getApplicationFormDetails,
  getApplicationFormDetailsForPrint,
} from "src/services/fetch/fetchers/applicationFetcher";
import { logger } from "src/services/logger/simplerLogger";
import {
  ApplicationFormDetail,
  ApplicationResponseDetail,
} from "src/types/applicationResponseTypes";
import { FormValidationWarning, UiSchema } from "src/types/applyForm/types";
import { Attachment } from "src/types/attachmentTypes";
import { FormDetail, FormRenderer } from "src/types/formResponseTypes";

import { processFormSchema } from "./applyForm/applyFormUtils";
import {
  findIgnoredListRules,
  findUnsupportedControls,
  jsonFormsToUiSchema,
  JsonFormsUiSchema,
} from "./applyForm/jsonFormsUiSchema";
import {
  unimplementedRuleKeys,
  validateUiSchema,
} from "./applyForm/validateUiSchema";

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
        formRenderer: FormRenderer;
        // Present when formRenderer is "jsonforms"; formUiSchema is then its equivalent
        // section/field tree, for warnings and navigation.
        jsonFormsUiSchema?: JsonFormsUiSchema;
        formValidationWarnings: FormValidationWarning[] | null;
        applicationAttachments: Attachment[];
        createdAt?: string;
        updatedAt?: string;
      };
    };

const MAX_LOGGED_SCHEMA_ERRORS = 5;

/*
  Condenses ajv output to a single line. Logging the whole ui schema plus every
  error produced hundreds of lines per invalid form, which buried the rest of the
  server and e2e output. `params` is kept because ajv puts the offending key in
  there rather than in `message` for keywords like additionalProperties and enum.
*/
const summarizeUiSchemaErrors = (errors: ErrorObject[]) => {
  const summary = errors
    .slice(0, MAX_LOGGED_SCHEMA_ERRORS)
    .map((error) => {
      const params = Object.keys(error.params ?? {}).length
        ? ` ${JSON.stringify(error.params)}`
        : "";

      return `${error.instancePath || "/"}: ${error.message ?? "invalid"}${params}`;
    })
    .join("; ");
  const remaining = errors.length - MAX_LOGGED_SCHEMA_ERRORS;

  return remaining > 0 ? `${summary} (+${remaining} more)` : summary;
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

  // API can take either internal token or session token to auth
  if (!internalToken) {
    const session = await getSession();

    if (!session || !session.token) {
      logger.error(
        { applicationId, appFormId },
        "No active session to access form",
      );
      return { error: "UnauthorizedError" };
    }
  }

  const formDetailsPromise = internalToken
    ? getApplicationFormDetailsForPrint(internalToken, applicationId, appFormId)
    : getApplicationFormDetails(applicationId, appFormId);

  try {
    const response = await formDetailsPromise;

    if (response.status_code !== 200) {
      logger.error(
        { applicationId, appFormId, status_code: response.status_code },
        "Error retrieving form details",
      );
      return { error: "TopLevelError" };
    }

    applicationFormData = response.data;
    formData = applicationFormData.form;
    if (!formData) {
      logger.error({ applicationId, appFormId }, "No form data found");
      return { error: "TopLevelError" };
    }

    if (applicationFormData.application_form_id !== appFormId) {
      logger.error(
        {
          applicationId,
          appFormId,
          responseAppFormId: applicationFormData.application_form_id,
        },
        "Application form ids do not match",
      );
      return { error: "TopLevelError" };
    }
    formValidationWarnings =
      (response.warnings as unknown as FormValidationWarning[]) || null;
  } catch (e) {
    const errorStatus = parseErrorStatus(e as ApiRequestError);

    if (errorStatus === 401) {
      return { error: "UnauthorizedError" };
    }

    if (errorStatus === 404) {
      logger.error(
        { err: e, applicationId, appFormId },
        "Error retrieving application details",
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
    form_ui_schema,
    form_renderer: formRenderer = "sgg",
  } = formData;

  let formUiSchema: UiSchema;
  let jsonFormsUiSchema: JsonFormsUiSchema | undefined;
  if (formRenderer === "jsonforms") {
    jsonFormsUiSchema = form_ui_schema as JsonFormsUiSchema;
    try {
      const { formSchema } = processFormSchema(form_json_schema);
      formUiSchema = jsonFormsToUiSchema(jsonFormsUiSchema, formSchema);
      // A control no widget can render falls back to a plain JSON Forms input. That input
      // has no `name` attribute, so it's left out of the form's FormData and isn't saved.
      for (const control of findUnsupportedControls(
        jsonFormsUiSchema,
        formSchema,
      )) {
        logger.warn(
          { formId, formName, control },
          "Form has a control that can't be rendered by any widget. The answer provided to this field won't be saved",
        );
      }
      // The field-list widget renders a list's entries itself, so JSON Forms never applies
      // the rules on the fields inside them.
      for (const control of findIgnoredListRules(jsonFormsUiSchema)) {
        logger.warn(
          { formId, formName, control },
          "Form has a rule on a field inside a list that won't be applied. The field will always be shown and enabled",
        );
      }
    } catch (e) {
      logger.error({ err: e, formId }, "Error converting JSON Forms ui schema");
      return { error: "TopLevelError" };
    }
  } else {
    formUiSchema = form_ui_schema as UiSchema;
  }

  const schemaErrors = validateUiSchema(formUiSchema);
  if (schemaErrors) {
    logger.error(
      { formId, schemaErrors: summarizeUiSchemaErrors(schemaErrors) },
      "Error validating form ui schema",
    );
    return { error: "TopLevelError" };
  }

  // Rules the UI schema declares and this renderer does not act on. Logged rather than
  // ignored silently: a conditionally disabled field renders enabled, and the applicant has
  // no way to tell that the form asked for anything else.
  const ignoredRules = unimplementedRuleKeys(formUiSchema);
  if (ignoredRules.length) {
    logger.warn(
      { formId, formName, rules: ignoredRules },
      "Form has UI rules the SGG renderer doesn't support yet. The fields they apply to will always be shown and enabled",
    );
  }

  try {
    const result = processFormSchema(form_json_schema);
    return {
      data: {
        applicationAttachments: applicationFormData.application_attachments,
        applicationResponse,
        applicationName: applicationFormData.application_name,
        formId,
        formName,
        formSchema: result.formSchema,
        formUiSchema,
        formRenderer,
        jsonFormsUiSchema,
        formValidationWarnings,
        createdAt: applicationFormData.created_at,
        updatedAt: applicationFormData.updated_at,
      },
    };
  } catch (e) {
    logger.error({ err: e, formId }, "Error parsing JSON schema");
    return { error: "TopLevelError" };
  }
}
