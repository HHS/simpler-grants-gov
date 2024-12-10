"use client";

import Cookies from "js-cookie";
import { ErrorProps } from "src/types/uiTypes";

import { GridContainer } from "@trussworks/react-uswds";

export default function UserError({ error }: ErrorProps) {
  if (!Cookies.get("session")) {
    throw new Error("not logged in!");
  }
  return (
    <GridContainer className="padding-y-1 tablet:padding-y-3 desktop-lg:padding-y-15 measure-2">
      <h1>Error</h1>
      {error.message && <div>{error.message}</div>}
    </GridContainer>
  );
}
