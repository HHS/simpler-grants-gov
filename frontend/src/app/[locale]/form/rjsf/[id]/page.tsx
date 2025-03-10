import { Metadata } from "next";
import NotFound from "src/app/[locale]/not-found";
import withFeatureFlag from "src/hoc/withFeatureFlag";
import { WithFeatureFlagProps } from "src/types/uiTypes";

import BetaAlert from "src/components/BetaAlert";
import { redirect } from "next/navigation";
import { GridContainer } from "@trussworks/react-uswds";
import * as formSchema from "./formSchema.json"
import * as uiSchema from "./uiSchema.json"
import ClientForm from "src/app/[locale]/form/rjsf/[id]/ClientForm";
// import { RJSFSchema } from '@rjsf/utils';
// import dynamic from "next/dynamic";


type FormProps = {
  params: Promise<{ id: string }>;
} & WithFeatureFlagProps;


export function generateMetadata() {
  const meta: Metadata = {
    title: `Form test for form React JSON Schema`,
    description: "this is the form",
  };
  return meta;
}

const getFormDetails = () => {
    return JSON.parse(JSON.stringify(formSchema)) as object;
}

const getuiSchemas = () => {
    return JSON.parse(JSON.stringify(uiSchema)) as object;
}

async function FormPage({ params }: FormProps) {
  const { id } = await params;
  const idForParsing = Number(id);
  if (isNaN(idForParsing) || idForParsing < 1) {
    return <NotFound />;
  }

  const jsonFormSchema = getFormDetails();
  const uiSchemas = getuiSchemas();

  return (
    <GridContainer>
      <BetaAlert />
      <h1>Form {id}</h1>
      <ClientForm schema={jsonFormSchema} uiSchema={uiSchemas} />
    </GridContainer>
  );
}

export default withFeatureFlag<FormProps, never>(
    FormPage,
  "opportunityOff",
  () => redirect("/maintenance"),
);
