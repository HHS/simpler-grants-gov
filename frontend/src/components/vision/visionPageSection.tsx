import React from "react";
import { Grid, GridContainer } from "@trussworks/react-uswds";

interface VisionPageSectionProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export default function VisionPageSection({
  children,
  className = "",
  title = "",
}: VisionPageSectionProps) {
  return (
    <div className={className}>
      <GridContainer className="display-flex flex-column padding-y-4 grid-container tablet-lg:flex-row tablet-lg:padding-y-6">
        <Grid row>
          <Grid tabletLg={{ col: 4 }}>
            <h2 className="margin-0 font-sans-lg tablet:font-sans-xl tablet-lg:maxw-card-lg">
              {title}
            </h2>
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
