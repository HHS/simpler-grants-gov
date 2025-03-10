import React from "react";
import { Grid, GridContainer } from "@trussworks/react-uswds";

interface RoadmapPageSectionProps {
  sectionContent: React.ReactNode;
  sectionTitle?: string;
  extraClasses?: string;
}

export default function RoadmapPageSection({
  sectionContent,
  sectionTitle = "",
  extraClasses = "",
}: RoadmapPageSectionProps) {
  return (
    <div className={`${extraClasses && extraClasses}`}>
      <GridContainer className="display-flex flex-column padding-y-4 grid-container tablet-lg:flex-row tablet-lg:padding-y-6">
        <Grid row>
          <Grid tabletLg={{ col: 4 }}>
            <h2 className="margin-0 font-sans-lg tablet:font-sans-xl tablet-lg:maxw-card-lg">
              {sectionTitle}
            </h2>
          </Grid>
          <Grid
            tabletLg={{ col: 8 }}
            className="margin-top-2 margin-bottom-0 tablet-lg:margin-0"
          >
            {sectionContent}
          </Grid>
        </Grid>
      </GridContainer>
    </div>
  );
}
