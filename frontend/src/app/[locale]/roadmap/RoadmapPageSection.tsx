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
    <div className={`padding-y-5 ${sectionBackgroundColorClass}`}>
      <GridContainer>
        <Grid row>
          <Grid tablet={{ col: 3 }}>
            <h2 className="margin-y-0" style={{ maxWidth: 200 }}>
              {sectionTitle}
            </h2>
          </Grid>
          <Grid className="margin-y-2 tablet:margin-y-0" tablet={{ col: 9 }}>
            {sectionContent}
          </Grid>
        </Grid>
      </GridContainer>
    </div>
  );
}
