import $RefParser from "@apidevtools/json-schema-ref-parser";
import { Metadata } from "next";
import TopLevelError from "src/app/[locale]/error/page";
import NotFound from "src/app/[locale]/not-found";
import { ApiRequestError, parseErrorStatus } from "src/errors";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { getApplicationDetails } from "src/services/fetch/fetchers/applicationFetcher";
import { getFormDetails } from "src/services/fetch/fetchers/formsFetcher";
import { ApplicationDetail } from "src/types/applicationResponseTypes";
import { FormDetail } from "src/types/formResponseTypes";

import { redirect } from "next/navigation";
import { GridContainer } from "@trussworks/react-uswds";

import ApplyForm from "src/components/applyForm/ApplyForm";
import { getApplicationResponse } from "src/components/applyForm/utils";
import { validateUiSchema } from "src/components/applyForm/validate";
import BetaAlert from "src/components/BetaAlert";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  const meta: Metadata = {
    title: `Form test for form React JSON Schema`,
    description: "this is the form",
  };
  return meta;
}

interface formPageProps {
  params: Promise<{ formId: string; applicationId: string; locale: string }>;
}

async function FormPage({ params }: formPageProps) {
  const { applicationId, formId } = await params;
  let formData = {} as FormDetail;
  let applicationData = {} as ApplicationDetail;

  try {
    const response = await getFormDetails(formId);
    if (response.status_code !== 200) {
      console.error(
        `Error retrieving form details for formID (${formId})`,
        response,
      );
      return <TopLevelError />;
    }
    formData = response.data;
  } catch (e) {
    console.error(
      `Error retrieving application details for formId ${formId}:`,
      e,
    );
    if (parseErrorStatus(e as ApiRequestError) === 404) {
      return <NotFound />;
    }
    return <TopLevelError />;
  }

  try {
    const response = await getApplicationDetails(applicationId);
    if (response.status_code !== 200) {
      console.error(
        `Error retrieving form details for applicationID (${applicationId}), formID (${formId})`,
        response,
      );
      return <TopLevelError />;
    }
    applicationData = response.data;
  } catch (e) {
    if (parseErrorStatus(e as ApiRequestError) === 404) {
      console.error(
        `Error retrieving application details for applicationID (${applicationId}), formId ${formId}:`,
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
  if (schemaErrors) {
    console.error("Error validating form", schemaErrors);
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
      <BetaAlert containerClasses="margin-top-5" />
      <GridContainer>
        <h1>Form demo for &quot;{form_name}&quot; form</h1>
        <legend className="usa-legend">
          The following is a demo of the apply forms.
        </legend>
        <p>
          Required fields are marked with an asterisk (
          <abbr
            title="required"
            className="usa-hint usa-hint--required text-no-underline"
          >
            *
          </abbr>
          ).
        </p>
        <ApplyForm
          savedFormData={application_response}
          formSchema={formSchema}
          uiSchema={form_ui_schema}
          formId={form_id}
          applicationId={applicationId}
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
