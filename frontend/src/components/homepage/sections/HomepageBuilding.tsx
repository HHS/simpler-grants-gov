import BuildingImage from "public/img/homepage-building.jpg";

import { useMessages, useTranslations } from "next-intl";
import Image from "next/image";
import { Grid, GridContainer } from "@trussworks/react-uswds";

const BuildingContent = () => {
  const t = useTranslations("Homepage.sections.building");
  const messages = useMessages() as unknown as IntlMessages;
  const { paragraphs } = messages.Homepage.sections.building;

  return (
    <GridContainer data-testid="homepage-building">
      <Grid row gap="md" className="padding-6">
        <Grid
          tablet={{
            col: true,
          }}
        >
          <Image
            alt="events-img"
            className="height-auto position-relative padding-right-6 padding-top-3"
            src={BuildingImage}
          />
        </Grid>
        <Grid
          tablet={{
            col: true,
          }}
        >
          <Grid>
            <h1>
              {t.rich("title", {
                span: (chunks) => <span className="text-italic">{chunks}</span>,
              })}
            </h1>
          </Grid>
          <Grid>
            {paragraphs.map((paragraph: string, paragraphIdx: number) => (
              <p
                className="line-height-sans-3 font-sans-md tablet:font-sans-lg text-balance"
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
