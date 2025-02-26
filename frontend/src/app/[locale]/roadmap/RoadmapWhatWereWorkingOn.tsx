import { useMessages, useTranslations } from "next-intl";
import { Grid, GridContainer } from "@trussworks/react-uswds";

import RoadmapPageSection from "./RoadmapPageSection";

export default function () {
  const t = useTranslations("Roadmap.sections.progress");
  const messages = useMessages() as unknown as IntlMessages;

  return (
    <RoadmapPageSection
      sectionTitle={t("title")}
      sectionContent={
        <GridContainer>
          {messages.Roadmap.sections.progress.contentItems.map((i, j) => (
            <Grid row>
              {i.map((k, l) => (
                <Grid tablet={{ col: 6 }}>
                  <h3 style={{ fontSize: 18 }}>{k.title}</h3>
                  <div className="font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
                    {k.content}
                  </div>
                </Grid>
              ))}
            </Grid>
          ))}
        </GridContainer>
      }
    />
  );
}
