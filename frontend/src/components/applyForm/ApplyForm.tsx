"use client";

import { RJSFSchema } from "@rjsf/utils";
import { isEmpty } from "lodash";
import { useFormStatus } from "react-dom";
import { AttachmentsProvider } from "src/hooks/ApplicationAttachments";
import { Attachment } from "src/types/attachmentTypes";

import { useTranslations } from "next-intl";
import React, { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, FormGroup } from "@trussworks/react-uswds";

import { handleFormAction } from "./actions";
import { ApplyFormMessage } from "./ApplyFormMessage";
import ApplyFormNav from "./ApplyFormNav";
import { FormFields } from "./FormFields";
import { FormValidationWarning, UiSchema } from "./types";
import { getFieldsForNav, shapeFormData } from "./utils";

type ApplyFormProps = {
  applicationId: string;
  formId: string;
  formSchema: RJSFSchema;
  savedFormData: object;
  uiSchema: UiSchema;
  validationWarnings: FormValidationWarning[] | null;
  attachments: Attachment[];
};

function stripIndexPrefix(fd: FormData): FormData {
  const out = new FormData();
  for (const [k, v] of fd.entries()) {
    out.append(k.replace(/^\d+_/, ""), v);
  }
  return out;
}

const ApplyForm: React.FC<ApplyFormProps> = ({
  applicationId,
  formId,
  formSchema,
  savedFormData,
  validationWarnings,
  uiSchema,
  attachments,
}) => {
  const { pending } = useFormStatus();
  const t = useTranslations("Application.applyForm");
  const required = t.rich("required", {
    abr: (content) => (
      <abbr
        title="required"
        className="usa-hint usa-hint--required text-no-underline"
      >
        {content}
      </abbr>
    ),
  });

  const [formState, formAction] = useActionState(handleFormAction, {
    applicationId,
    error: false,
    formId,
    formData: new FormData(),
    saved: false,
  });

  const { formData, error, saved } = formState;

  // Turn any FormData from the action into a shaped object; otherwise pass through the object.
  const clientHydratedData: object = useMemo(() => {
    if (typeof FormData !== "undefined" && formData instanceof FormData) {
      const stripped = stripIndexPrefix(formData);
      const shaped = shapeFormData<Record<string, unknown>>(stripped, formSchema);
      // eslint-disable-next-line no-console
      console.log("[ApplyForm] hydrated from FormData → shaped object:", shaped);
      return shaped;
    }
    return formData as object;
  }, [formData, formSchema]);

  // Prefer action result if present; else fall back to server-provided data
  const formObject = !isEmpty(formState.formData)
    ? clientHydratedData
    : savedFormData;

  // ── Force FormFields to remount whenever the action returns new data ──────────
  const lastDataRef = useRef<unknown>(null);
  const [formVersion, setFormVersion] = useState(0);
  useEffect(() => {
    const isNewIdentity = lastDataRef.current !== formState.formData;
    if (isNewIdentity && !isEmpty(formState.formData)) {
      lastDataRef.current = formState.formData;
      setFormVersion((v) => v + 1);
    }
  }, [formState.formData]);


  const boolSignature = useMemo(() => {
    try {
      const obj = formObject as Record<string, unknown>;
      const keys = Object.keys(obj).sort();
      const pairs = keys
        .filter((k) => typeof obj[k] === "boolean")
        .map((k) => `${k}:${String(obj[k])}`)
        .join("|");
      return pairs;
    } catch {
      return "";
    }
  }, [formObject]);

  useEffect(() => {
    // If boolean signature changed (but identity didn’t), bump version too
    setFormVersion((v) => v + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boolSignature]);

  const navFields = useMemo(() => getFieldsForNav(uiSchema), [uiSchema]);

  if (!formSchema || !("properties" in formSchema) || isEmpty(formSchema.properties)) {
    return (
      <Alert data-testid="alert" type="error" heading="Error" headingLevel="h4">
        Error rendering form
      </Alert>
    );
  }

  return (
    <form
      className="flex-1 margin-top-2 simpler-apply-form"
      action={formAction}
      noValidate
    >
      <div className="display-flex flex-justify">
        <div>{required}</div>
        <Button
          data-testid="apply-form-save"
          type="submit"
          name="apply-form-button"
          className="margin-top-0"
          value="save"
        >
          {pending ? "Saving..." : "Save"}
        </Button>
      </div>

      <div className="usa-in-page-nav-container">
        <FormGroup className="order-2 width-full">
          <ApplyFormMessage
            saved={saved}
            error={error}
            validationWarnings={validationWarnings}
          />
          <AttachmentsProvider value={attachments ?? []}>
            <FormFields
              key={`fields-v${formVersion}`}
              errors={saved ? validationWarnings : null}
              formData={formObject}
              schema={formSchema}
              uiSchema={uiSchema}
            />
          </AttachmentsProvider>
        </FormGroup>
        <ApplyFormNav title={t("navTitle")} fields={navFields} />
      </div>
    </form>
  );
};

export default ApplyForm;
