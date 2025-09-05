import React from "react";
import { Grid, GridContainer } from "@trussworks/react-uswds";

interface DeveloperPageSectionProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export default function DeveloperPageSection({
  children,
  className = "",
  title = "",
}: DeveloperPageSectionProps) {
  return (
    <div className={className}>
      <GridContainer className="padding-y-4 grid-container tablet-lg:padding-y-6">
        <Grid row gap>
          <Grid tabletLg={{ col: 4 }}>
            <h2>{title}</h2>
          </Grid>
          <Grid
            tabletLg={{ col: 8 }}
            className="margin-top-2 margin-bottom-0 tablet-lg:margin-0"
          >
            {children}
          </Grid>
        </Grid>
      </GridContainer>
    </div>
  );
}
