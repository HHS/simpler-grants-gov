import { useMessages, useTranslations } from "next-intl";
import { Grid, GridContainer } from "@trussworks/react-uswds";

import { GithubIssueLink, gitHubLinkForIssue } from "../process/ProcessNext";
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
            <Grid row>
              {i.map((k, l) => (
                <Grid tablet={{ col: 6 }}>
                  <h3 style={{ fontSize: 18 }}>{k.title}</h3>
                  <div style={{ lineHeight: "24.3px", fontSize: 18 }}>
                    {t.rich(`contentItems.${j}.${l}.content`, {
                      p: (chunks) => <p className={"margin-0"}>{chunks}</p>,
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
          <h3 style={{ fontSize: 18 }}>
            <GithubIssueLink chunks={t("link")} />
          </h3>
        </GridContainer>
      }
    />
  );
}
