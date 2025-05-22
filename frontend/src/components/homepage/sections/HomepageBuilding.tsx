import BuildingImage from "public/img/homepage-building.jpg";

import { useMessages, useTranslations } from "next-intl";
import Image from "next/image";
import { Grid, GridContainer } from "@trussworks/react-uswds";

const BuildingContent = () => {
  const t = useTranslations("Homepage.sections.building");
  const messages = useMessages() as unknown as IntlMessages;
  const { paragraphs } = messages.Homepage.sections.building;

  return (
    <GridContainer
      data-testid="homepage-building"
      className="padding-y-4 tablet-lg:padding-y-6"
    >
      <Grid row gap>
        <Grid
          tabletLg={{
            col: true,
          }}
          className="tablet-lg:padding-right-6"
        >
          <Image
            alt="events-img"
            className="height-auto position-relative margin-bottom-2 tablet-lg:margin-bottom-0"
            src={BuildingImage}
          />
        </Grid>
        <Grid
          tabletLg={{
            col: true,
          }}
        >
          <Grid>
            <h2>
              {t.rich("title", {
                span: (chunks) => <span className="text-italic">{chunks}</span>,
              })}
            </h2>
            {paragraphs.map((paragraph: string, paragraphIdx: number) => (
              <p
                className="font-sans-md tablet-lg:font-sans-lg"
                key={paragraphIdx}
              >
                {paragraph}
              </p>
            ))}
          </Grid>
        </Grid>
      </Grid>
    </GridContainer>
  );
};

export default BuildingContent;
