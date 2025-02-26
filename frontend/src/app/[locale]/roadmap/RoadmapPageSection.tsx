import React from "react";
import { Grid, GridContainer } from "@trussworks/react-uswds";

interface RoadmapPageSectionProps {
  sectionTitle: string;
  sectionContent: React.ReactNode;
  sectionBackgroundColorClass?: string;
}

export default function RoadmapPageSection({
  sectionTitle,
  sectionContent,
  sectionBackgroundColorClass = "",
}: RoadmapPageSectionProps) {
  return (
    <div className={`${sectionBackgroundColorClass}`}>
      <GridContainer>
        <Grid row>
          <Grid tablet={{ col: 4 }}>
            <h2>{sectionTitle}</h2>
          </Grid>
          <Grid tablet={{ col: 8 }}>{sectionContent}</Grid>
        </Grid>
      </GridContainer>
    </div>
  );
}
