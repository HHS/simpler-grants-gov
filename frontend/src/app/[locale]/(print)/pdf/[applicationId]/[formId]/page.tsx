import $RefParser from "@apidevtools/json-schema-ref-parser";
import TopLevelError from "src/app/[locale]/(base)/error/page";
// import NotFound from "src/app/[locale]/not-found";
import ApplyForm from "src/components/applyForm/ApplyForm";
import { getApplicationResponse } from "src/components/applyForm/utils";
import { validateUiSchema } from "src/components/applyForm/validate";
import { parseErrorStatus, ApiRequestError } from "src/errors";
import { getSession } from "src/services/auth/session";
import { getApplicationDetails } from "src/services/fetch/fetchers/applicationFetcher";
import { getFormDetails } from "src/services/fetch/fetchers/formsFetcher";
import { ApplicationDetail } from "src/types/applicationResponseTypes";
import { FormDetail } from "src/types/formResponseTypes";

interface pdfPageProps {
  params: Promise<{ formId: string; applicationId: string; locale: string }>;
}
async function PDFPage({ params }: pdfPageProps) {
  const { applicationId, formId } = await params;
  let formData = {} as FormDetail;
  let applicationData = {} as ApplicationDetail;
  const session = await getSession();
  // console.log(session.token)
    // throw new UnauthorizedError("No active session to access form");


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
      return <>Form not found</>;
    }
    return <TopLevelError />;
  }

  try {
    const response = await getApplicationDetails(applicationId, session.token);
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
      return <>application not found</>;
    }
    return <TopLevelError />;
  }

  const application_response = getApplicationResponse(
    applicationData.application_forms,
    formId,
  );
  const { form_id, form_json_schema, form_ui_schema } = formData;

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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    formSchema = await $RefParser.dereference(form_json_schema);
  } catch (e) {
    console.error("Error parsing JSON schema", e);
    return <TopLevelError />;
  }

  return (
    <>
        <ApplyForm
          savedFormData={application_response}
          formSchema={formSchema}
          uiSchema={form_ui_schema}
          formId={form_id}
          applicationId={applicationId}
        />
    </>
  );
}

export default PDFPage;
