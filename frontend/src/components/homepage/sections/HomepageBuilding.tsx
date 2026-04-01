import BuildingImage from "public/img/homepage-building.jpg";
import { ExternalRoutes } from "src/constants/routes";

import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { Grid, GridContainer } from "@trussworks/react-uswds";

const BuildingContent = () => {
  const t = useTranslations("Homepage.sections.building");

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
            {/* {paragraphs.map((paragraph: string, paragraphIdx: number) => (
              <p
                className="font-sans-md tablet-lg:font-sans-lg"
                key={paragraphIdx}
              >
                {paragraph}
              </p>
            ))} */}
            <p className="font-sans-md tablet-lg:font-sans-lg">
              {t("paragraph1")}
            </p>
            <p className="font-sans-md tablet-lg:font-sans-lg">
              {t.rich("paragraph2", {
                code: (chunks) => (
                  <a
                    href={ExternalRoutes.GITHUB_REPO}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="usa-link--external"
                  >
                    {chunks}
                  </a>
                ),
                roadmap: (chunks) => <Link href="/roadmap">{chunks}</Link>,
                vision: (chunks) => <Link href="/vision">{chunks}</Link>,
              })}
            </p>
          </Grid>
        </Grid>
      </Grid>
    </GridContainer>
  );
};

export default BuildingContent;
