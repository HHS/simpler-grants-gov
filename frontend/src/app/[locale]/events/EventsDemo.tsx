import { useTranslations } from "next-intl";
import Image from "next/image";
import EventsDemoImg from "public/img/events-demo.png";

import {
  Grid,
  GridContainer,
} from "@trussworks/react-uswds";

const EventsDemo = () => {
  const t = useTranslations("Events.demo");

  return (
    <GridContainer data-testid="events-demo-content" className="padding-x-4 bg-base-lightest">
      <Grid row gap="md" className="padding-y-6">
        <Grid tablet={{
          col: true
        }}>
          <Image
            alt="events-img"
            className="height-auto position-relative padding-x-6"
            src={EventsDemoImg}
          />
        </Grid>
        <Grid tablet={{
          col: true
        }}>
          <Grid>
            <h2>
              {t("title")}
            </h2>
          </Grid>
          <Grid>
            <p className="font-sans-md line-height-sans-4">
              {t("description")}
            </p>
            <h3 className="padding-top-2">{t("watch")}</h3>
            <a
              href="https://vimeo.com/1050177794/278fa78e0b?share=copy"
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans-md line-height-sans-4"
            >
              {t("watch_link")}
            </a>
          </Grid>
        </Grid>
      </Grid>
    </GridContainer>
  );
};

export default EventsDemo;
