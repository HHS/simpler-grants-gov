import { useTranslations } from "next-intl";
import Image from "next/image";
import EventsDemoImg from "public/img/events-demo.png";

import {
  Grid,
  GridContainer,
} from "@trussworks/react-uswds";

const demoLink = "https://vimeo.com/1050177794/278fa78e0b?share=copy"

export default function EventsDemo() {
  const t = useTranslations("Events.demo");

  return (
    <GridContainer data-testid="events-demo-content" className="padding-x-4">
      <Grid row gap="md" className="padding-6">
        <Grid
          tablet={{
            col: true,
          }}
        >
          <Image
            alt="events-img"
            className="height-auto position-relative padding-right-6 padding-top-3"
            src={EventsDemoImg}
          />
        </Grid>
        <Grid
          tablet={{
            col: true,
          }}
        >
          <Grid>
            <h2>{t("title")}</h2>
          </Grid>
          <Grid>
            <p className="font-sans-md line-height-sans-4">
              {t("description")}
            </p>
            <h3 className="padding-top-2">{t("watch")}</h3>
            <a
              href={demoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans-md line-height-sans-4"
            >
              {t("watchLink")}
            </a>
          </Grid>
        </Grid>
      </Grid>
    </GridContainer>
  );
}
