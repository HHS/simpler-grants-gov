import { useMessages, useTranslations } from "next-intl";
import { Grid, GridContainer } from "@trussworks/react-uswds";

import GithubIssueLink, { gitHubLinkForIssue } from "src/components/GithubLink";
import RoadmapPageSection from "./RoadmapPageSection";

export default function RoadmapWhatWereWorkingOn() {
  const t = useTranslations("Roadmap.sections.progress");
  const messages = useMessages() as unknown as IntlMessages;
  const { contentItems } = messages.Roadmap.sections.progress;

  return (
    <RoadmapPageSection
      sectionTitle={t("title")}
      sectionContent={
        <GridContainer className="padding-0">
          {contentItems.map((i, j) => (
            <Grid
              row
              className="margin-bottom-0 tablet:margin-bottom-3"
              key={`roadmap-what-were-working-on-${j}`}
            >
              {i.map((k, l) => (
                <Grid
                  className="margin-bottom-3 tablet:grid-col-6 tablet:padding-right-7"
                  key={`roadmap-what-were-working-on-${j}-${l}`}
                >
                  <h3 className="font-sans-xs margin-0">
                    {t(`contentItems.${j}.${l}.title`)}
                  </h3>
                  <div className="font-sans-xs margin-top-1">
                    {t.rich(`contentItems.${j}.${l}.content`, {
                      p: (chunks) => <p className=" margin-y-05">{chunks}</p>,
                      linkGithub3045: gitHubLinkForIssue(3045),
                      linkGithub2875: gitHubLinkForIssue(2875),
                      linkGithub2640: gitHubLinkForIssue(2640),
                      linkGithub3348: gitHubLinkForIssue(3348),
                    })}
                  </div>
                </Grid>
              ))}
            </Grid>
          ))}
          <h3 className="font-sans-xs">
            <GithubIssueLink chunks={t("link")} />
          </h3>
        </GridContainer>
      }
    />
  );
}
