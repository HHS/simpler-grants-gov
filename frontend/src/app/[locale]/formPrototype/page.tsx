import { Metadata } from "next";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";

import { redirect } from "next/navigation";
import { GridContainer } from "@trussworks/react-uswds";

import BetaAlert from "src/components/BetaAlert";
import CreateApplicationButton from "src/components/workspace/CreateApplicationButton";

export function generateMetadata() {
  const meta: Metadata = {
    title: `Simpler apply form prototype`,
  };
  return meta;
}

function FormPrototypePage() {
  return (
    <GridContainer>
      <BetaAlert />
      <h1>Apply form prototype</h1>
      <legend className="usa-legend">
        The following is a demo of the apply process.
      </legend>
      <p>
        <CreateApplicationButton />
      </p>
    </GridContainer>
  );
}

export default withFeatureFlag(FormPrototypePage, "applyFormPrototypeOff", () =>
  redirect("/maintenance"),
);
