import EventsDemoImg from "public/img/events-demo.png";

import { useMessages, useTranslations } from "next-intl";
import Image from "next/image";
import { Grid, GridContainer } from "@trussworks/react-uswds";

export default function EventsDemo() {
  const t = useTranslations("Events.demo");
  const messages = useMessages() as unknown as IntlMessages;
  const { watchLinks } = messages.Events.demo;

  return (
    <GridContainer
      data-testid="events-demo-content"
      className="padding-y-4 tablet-lg:padding-y-6"
    >
      <Grid row gap>
        <Grid tablet={{ col: 5 }}>
          <Image
            alt="events-img"
            className="height-auto position-relative"
            src={EventsDemoImg}
          />
        </Grid>
        <Grid tablet={{ col: 7 }}>
          <Grid>
            <h2>{t("title")}</h2>
          </Grid>
          <Grid>
            <p className="font-sans-md line-height-sans-4">
              {t("description")}
            </p>
            <h3>{t("watch")}</h3>
            <ul className="font-sans-md line-height-sans-4">
              {watchLinks.map((_watchLinks, watchLinkIdx) => (
                <li key={`big-demo-${watchLinkIdx}`}>
                  <a
                    href={watchLinks[watchLinkIdx].link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="usa-link--external"
                  >
                    {t(`watchLinks.${watchLinkIdx}.text`)}
                  </a>
                </li>
              ))}
            </ul>
          </Grid>
        </Grid>
      </Grid>
    </GridContainer>
  );
}
