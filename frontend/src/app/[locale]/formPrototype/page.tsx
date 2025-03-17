import { Metadata } from "next";
import withFeatureFlag from "src/hoc/withFeatureFlag";
import { WithFeatureFlagProps } from "src/types/uiTypes";

import { redirect } from "next/navigation";
import { GridContainer, Label } from "@trussworks/react-uswds";

import BetaAlert from "src/components/BetaAlert";
import ClientForm from "./ClientForm";
import * as formSchema from "./formSchema.json";
import * as uiSchema from "./uiSchema2.json";

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
  return uiSchema.default as object;
};

function FormPage() {
  const jsonFormSchema = getFormDetails();
  const uiSchema = getuiSchema();

  return (
    <GridContainer>
      <BetaAlert />
      <h1>Form Demo</h1>
      <Label htmlFor="client-form">
        The following is a demo of the SFS 424 Individual form.
      </Label>
      <ClientForm schema={jsonFormSchema} uiSchema={uiSchema} />
    </GridContainer>
  );
}

export default withFeatureFlag<WithFeatureFlagProps, never>(
  FormPage,
  "opportunityOff",
  () => redirect("/maintenance"),
);
