"use client";

import { GridContainer } from "@trussworks/react-uswds";

const TopLevelError = ({ error }: { error: Error }) => {
  return (
    <GridContainer>
      <h3>Error</h3>
      <div>{error.message}</div>
    </GridContainer>
  );
};

export default TopLevelError;
