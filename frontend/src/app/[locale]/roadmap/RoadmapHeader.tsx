import { useTranslations } from "next-intl";
import Image from "next/image";
import { Grid, GridContainer } from "@trussworks/react-uswds";

export default function RoadmapHeader() {
  const t = useTranslations("Roadmap");

  return (
    <div className="padding-y-5 text-white bg-primary-darkest">
      <GridContainer>
        <Grid row>
          <Grid tablet={{ col: 6 }}>
            <h1>{t("pageHeaderTitle")}</h1>
            <p className={"font-sans-sm"}>{t("pageHeaderParagraph")}</p>
          </Grid>
          <Grid
            tablet={{ col: 6 }}
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Image
              src="/img/roadmap-header-image.png"
              alt="Picture of person on a journey"
              width={100}
              height={200}
            />
          </Grid>
        </Grid>
      </GridContainer>
    </div>
  );
}
