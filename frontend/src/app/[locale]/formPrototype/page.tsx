import { Metadata } from "next";
import withFeatureFlag from "src/hoc/withFeatureFlag";
import { WithFeatureFlagProps } from "src/types/uiTypes";

import { redirect } from "next/navigation";
import { GridContainer } from "@trussworks/react-uswds";

import BetaAlert from "src/components/BetaAlert";
import ClientForm from "./ClientForm";
import * as formSchema from "./formSchema.json";
import * as uiSchema from "./uiSchema.json";

export function generateMetadata() {
  const meta: Metadata = {
    title: `Form test for form React JSON Schema`,
    description: "this is the form",
  };
  return meta;
}

const getFormDetails = () => {
  return JSON.parse(JSON.stringify(formSchema)) as object;
};

const getuiSchema = () => {
  // eslint-disable-next-line
  return uiSchema.default as undefined;
};

function FormPage() {
  const jsonFormSchema = getFormDetails();
  const uiSchema = getuiSchema();

  return (
    <GridContainer>
      <BetaAlert />
      <h1>Form Demo: Applicaction for Federal Assistance SF 424 - Individual</h1>
      <legend className="usa-legend">
        The following is a demo of the SF 424 Individual form.
      </legend>
      <p>
      Required fields are marked with an asterisk (<abbr title="required" className="usa-hint usa-hint--required text-no-underline

">*</abbr>).
    </p>
      <ClientForm schema={jsonFormSchema} uiSchema={uiSchema} />
    </GridContainer>
  );
}

export default withFeatureFlag<WithFeatureFlagProps, never>(
  FormPage,
  "opportunityOff",
  () => redirect("/maintenance"),
);
