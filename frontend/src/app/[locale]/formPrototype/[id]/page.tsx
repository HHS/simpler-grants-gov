import { Metadata } from "next";
import TopLevelError from "src/app/[locale]/error/page";
import NotFound from "src/app/[locale]/not-found";
import { ApiRequestError, parseErrorStatus } from "src/errors";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { getCompetitionDetails } from "src/services/fetch/fetchers/competitionsFetcher";
import { FormDetail } from "src/types/formResponseTypes";

import { redirect } from "next/navigation";
import { GridContainer } from "@trussworks/react-uswds";

import ApplyForm from "src/components/applyForm/ApplyForm";
import {
  validateFormSchema,
  validateUiSchema,
} from "src/components/applyForm/validate";
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
  params: Promise<{ id: string; locale: string }>;
}

async function FormPage({ params }: formPageProps) {
  const { id } = await params;
  let formData = {} as FormDetail;

  try {
    const response = await getCompetitionDetails(id);
    if (response.status_code !== 200) {
      throw new Error(
        `Error retrieving competition details: ${JSON.stringify(response.errors)}`,
      );
    }
    // TODO: this update so this is a list of forms on a competition endpoint
    formData = response.data.competition_forms[0].form;
  } catch (error) {
    if (parseErrorStatus(error as ApiRequestError) === 404) {
      return <NotFound />;
    }
    throw error;
  }

  const { form_id, form_json_schema, form_ui_schema } = formData;

  try {
    validateUiSchema(form_ui_schema);
    validateFormSchema(form_json_schema);
  } catch (error) {
    console.error("Error validating", error);
    return <TopLevelError />;
  }

  return (
    <GridContainer>
      <BetaAlert />
      <h1>
        Form Demo: Applicaction for Federal Assistance SF 424 - Individual
      </h1>
      <legend className="usa-legend">
        The following is a demo of the SF 424 Individual form.
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
        formSchema={form_json_schema}
        uiSchema={form_ui_schema}
        formId={form_id}
      />
    </GridContainer>
  );
}

export default withFeatureFlag<formPageProps, never>(
  FormPage,
  "applyFormPrototypeOff",
  () => redirect("/maintenance"),
);
