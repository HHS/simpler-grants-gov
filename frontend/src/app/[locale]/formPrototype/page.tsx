import { Metadata } from "next";
import TopLevelError from "src/app/[locale]/error/page";
import NotFound from "src/app/[locale]/not-found";
import { ApiRequestError, parseErrorStatus } from "src/errors";
import withFeatureFlag from "src/hoc/withFeatureFlag";
import { getFormDetails } from "src/services/fetch/fetchers/formFetcher";
import { formDetail } from "src/types/formResponseTypes";
import { WithFeatureFlagProps } from "src/types/uiTypes";

import { redirect } from "next/navigation";
import { GridContainer } from "@trussworks/react-uswds";

import ApplyForm from "src/components/applyForm/ApplyForm";
import {
  validateFormSchema,
  validateUiSchema,
} from "src/components/applyForm/validate";
import BetaAlert from "src/components/BetaAlert";

export function generateMetadata() {
  const meta: Metadata = {
    title: `Form test for form React JSON Schema`,
    description: "this is the form",
  };
  return meta;
}

async function FormPage() {
  let formData = {} as formDetail;
  const id = "anyform";
  try {
    const response = await getFormDetails(id);
    formData = response.data;
  } catch (error) {
    if (parseErrorStatus(error as ApiRequestError) === 404) {
      return <NotFound />;
    }
    throw error;
  }

  const { form_json_schema, form_ui_schema } = formData;
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
      <ApplyForm formSchema={form_json_schema} uiSchema={form_ui_schema} />
    </GridContainer>
  );
}

export default withFeatureFlag<WithFeatureFlagProps, never>(
  FormPage,
  "applyFormPrototypeOff",
  () => redirect("/maintenance"),
);
