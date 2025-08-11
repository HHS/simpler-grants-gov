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
import { getApplicationFormDetails } from "src/services/fetch/fetchers/applicationFetcher";
import { ApplicationFormDetail } from "src/types/applicationResponseTypes";
import { FormDetail } from "src/types/formResponseTypes";

import { redirect } from "next/navigation";
import { GridContainer } from "@trussworks/react-uswds";

import ApplyForm from "src/components/applyForm/ApplyForm";
import { FormValidationWarning } from "src/components/applyForm/types";
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

interface formPageProps {
  params: Promise<{ appFormId: string; applicationId: string; locale: string }>;
}

async function FormPage({ params }: formPageProps) {
  const { applicationId, appFormId } = await params;
  let applicationFormData = {} as ApplicationFormDetail;
  let formValidationWarnings: FormValidationWarning[] | null;
  let formId = "";
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
    );

    if (response.status_code !== 200) {
      console.error(
        `Error retrieving form details for applicationID (${applicationId}), appFormId (${appFormId})`,
        response,
      );
      return <TopLevelError />;
    }

    applicationFormData = response.data;
    formData = response.data.form;
    if (!formData) {
      console.error(
        `No form data found for applicationID (${applicationId}), appFormId (${appFormId}), formId (${formId})`,
      );
      return <TopLevelError />;
    }

    formId = applicationFormData.form.form_id;
    if (applicationFormData.application_form_id !== appFormId) {
      console.error(`Application form ids to do not match`);
      return <TopLevelError />;
    }
    formValidationWarnings =
      (response.warnings as unknown as FormValidationWarning[]) || null;
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

  const application_response = applicationFormData.application_response || {};

  const { form_id, form_name, form_json_schema, form_ui_schema } = formData;
  const schemaErrors = validateUiSchema(form_ui_schema);

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
              title: applicationFormData.application_name,
              path: `/workspace/applications/application/${applicationFormData.application_id}`,
            },
            {
              title: "Form",
              path: `/workspace/applications/application/${applicationFormData.application_id}/form/${applicationId}`,
            },
          ]}
        />
        <h1>{form_name}</h1>
        <ApplyForm
          applicationId={applicationId}
          validationWarnings={formValidationWarnings}
          savedFormData={application_response}
          formSchema={formSchema}
          uiSchema={form_ui_schema}
          formId={form_id}
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
