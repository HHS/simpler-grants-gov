import { Metadata } from "next";
import withFeatureFlag from "src/hoc/withFeatureFlag";
import { WithFeatureFlagProps } from "src/types/uiTypes";

import { redirect } from "next/navigation";
import { GridContainer } from "@trussworks/react-uswds";
import Link from "next/link";

import BetaAlert from "src/components/BetaAlert";

export function generateMetadata() {
  const meta: Metadata = {
    title: `Form test for form React JSON Schema`,
    description: "this is the form",
  };
  return meta;
}

function FormSuccess() {


  return (
    <GridContainer>
      <BetaAlert />
      <h1>
        Form Demo Success
      </h1>
      <Link className="usa-button" type="link" href="/formPrototype">Back</Link>
    </GridContainer>
  );
}

export default withFeatureFlag<WithFeatureFlagProps, never>(
  FormSuccess,
  "opportunityOff",
  () => redirect("/maintenance"),
);
