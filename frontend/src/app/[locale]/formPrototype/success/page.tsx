import { Metadata } from "next";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { WithFeatureFlagProps } from "src/types/uiTypes";

import { redirect } from "next/navigation";
import { Alert } from "@trussworks/react-uswds";

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
    <>
      <BetaAlert />
      <h1>Form Demo Success</h1>
      <Alert
        heading="Successful form submission"
        headingLevel="h3"
        type="success"
      >
        You successfully submitted the form.
      </Alert>
    </>
  );
}

export default withFeatureFlag<WithFeatureFlagProps, never>(
  FormSuccess,
  "applyFormPrototypeOff",
  () => redirect("/maintenance"),
);
