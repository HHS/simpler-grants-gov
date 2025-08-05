import $RefParser from "@apidevtools/json-schema-ref-parser";
import { Metadata } from "next";
import TopLevelError from "src/app/[locale]/error/page";
import NotFound from "src/app/[locale]/not-found";
import {
  ApiRequestError,
  parseErrorStatus,
  UnauthorizedError,
} from "src/errors";
import { getSession } from "src/services/auth/session";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { getApplicationDetails } from "src/services/fetch/fetchers/applicationFetcher";
import { ApplicationDetail } from "src/types/applicationResponseTypes";
import { Attachment } from "src/types/attachmentTypes";
import { FormDetail } from "src/types/formResponseTypes";

import { redirect } from "next/navigation";
import { GridContainer } from "@trussworks/react-uswds";

import { ClientApplyForm } from "src/components/applyForm/ClientApplyForm";
import { FormValidationWarning } from "src/components/applyForm/types";
import { getApplicationResponse } from "src/components/applyForm/utils";
import { validateUiSchema } from "src/components/applyForm/validate";
import BookmarkBanner from "src/components/BookmarkBanner";
import Breadcrumbs from "src/components/Breadcrumbs";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  const meta: Metadata = {
    title: `Form test for form React JSON Schema`,
    description: "this is the form",
  };
  return meta;
}

interface UiSchemaField {
  type: "field";
  definition: string;
  widget?: string;
}

interface UiSchemaSection {
  type: "section";
  name: string;
  label?: string;
  children: (UiSchemaField | UiSchemaSection)[];
}

type UiSchema = (UiSchemaField | UiSchemaSection)[];

export function formHasAttachmentFields(uiSchema: UiSchema): boolean {
  for (const item of uiSchema) {
    if (item.type === "field" && item.widget?.startsWith("Attachment")) {
      return true;
    }

    if (item.type === "section" && Array.isArray(item.children)) {
      if (formHasAttachmentFields(item.children)) {
        return true;
      }
    }
  }
  return false;
}

interface formPageProps {
  params: Promise<{ appFormId: string; applicationId: string; locale: string }>;
}

async function FormPage({ params }: formPageProps) {
  const { applicationId, appFormId } = await params;
  let applicationAttachments: Attachment[] = [];
  let applicationData = {} as ApplicationDetail;
  let formValidationWarnings: FormValidationWarning[] | null;
  let formId = "";
  let formData: FormDetail | null;
  const session = await getSession();

  if (!session || !session.token) {
    throw new UnauthorizedError("No active session to access form");
  }

  try {
    const response = await getApplicationDetails(applicationId, session.token);

    if (response.status_code !== 200) {
      console.error(
        `Error retrieving form details for applicationID (${applicationId}), appFormId (${appFormId})`,
        response,
      );
      return <TopLevelError />;
    }

    applicationData = response.data;
    applicationAttachments = applicationData.application_attachments ?? [];

    formId =
      applicationData.application_forms?.find(
        (form) => form.application_form_id === appFormId,
      )?.form_id || "";
    if (!formId) {
      console.error(
        `No form found for applicationID (${applicationId}), appFormId (${appFormId})`,
      );
      return <TopLevelError />;
    }
    formData =
      applicationData.competition.competition_forms.find(
        (form) => form.form.form_id === formId,
      )?.form || null;
    if (!formData) {
      console.error(
        `No form data found for applicationID (${applicationId}), appFormId (${appFormId}), formId (${formId})`,
      );
      return <TopLevelError />;
    }

    formValidationWarnings =
      (applicationData.form_validation_warnings?.[
        appFormId
      ] as unknown as FormValidationWarning[]) || null;
  } catch (e) {
    if (parseErrorStatus(e as ApiRequestError) === 404) {
      console.error(
        `Error retrieving application details for applicationID (${applicationId}), appFormId ${appFormId}:`,
        e,
      );
      return <NotFound />;
    }
    return <TopLevelError />;
  }
  const application_response = getApplicationResponse(
    applicationData.application_forms,
    formId,
  );
  const { form_id, form_name, form_json_schema, form_ui_schema } = formData;
  const schemaErrors = validateUiSchema(form_ui_schema);

  const includeAttachments = formHasAttachmentFields(
    form_ui_schema as UiSchema,
  );
  const attachments = includeAttachments ? applicationAttachments : [];

  if (schemaErrors) {
    console.error(
      "Error validating form ui schema",
      form_ui_schema,
      schemaErrors,
    );
    return <TopLevelError />;
  }

  let formSchema = {};
  try {
    // creates single object for json schema from references
    formSchema = await $RefParser.dereference(form_json_schema);
  } catch (e) {
    console.error("Error parsing JSON schema", e);
    return <TopLevelError />;
  }

  return (
    <>
      <BookmarkBanner containerClasses="margin-y-3" />
      <GridContainer>
        <Breadcrumbs
          breadcrumbList={[
            { title: "home", path: "/" },
            {
              title: applicationData.application_name,
              path: `/workspace/applications/application/${applicationData.application_id}`,
            },
            {
              title: "Form",
              path: `/workspace/applications/application/${applicationData.application_id}/form/${applicationId}`,
            },
          ]}
        />
        <h1>{form_name}</h1>
        <ClientApplyForm
          validationWarnings={formValidationWarnings}
          savedFormData={application_response}
          formSchema={formSchema}
          uiSchema={form_ui_schema}
          formId={form_id}
          applicationId={applicationId}
          attachments={attachments}
        />
      </GridContainer>
    </>
  );
}

export default withFeatureFlag<formPageProps, never>(
  FormPage,
  "applyFormPrototypeOff",
  () => redirect("/maintenance"),
);
