import { Metadata } from "next";

import { GridContainer } from "@trussworks/react-uswds";

import BetaAlert from "src/components/BetaAlert";
import CreateApplicatinButton from "./CreateApplication";

export function generateMetadata() {
  const meta: Metadata = {
    title: `Simpler apply form prototype`,
  };
  return meta;
}

export default function FormPrototypePage() {
  return (
    <GridContainer>
      <BetaAlert />
      <h1>Apply form prototype</h1>
      <legend className="usa-legend">
        The following is a demo of the apply process.
      </legend>
      <p>
        <CreateApplicatinButton />
      </p>
    </GridContainer>
  );
}
