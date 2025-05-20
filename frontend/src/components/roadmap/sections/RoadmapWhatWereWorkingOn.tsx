import { useMessages, useTranslations } from "next-intl";

import GithubIssueLink, { gitHubLinkForIssue } from "src/components/GithubLink";
import RoadmapPageSection from "src/components/roadmap/RoadmapPageSection";
import { USWDSIcon } from "src/components/USWDSIcon";

export default function RoadmapWhatWereWorkingOn() {
  const t = useTranslations("Roadmap.sections.progress");
  const messages = useMessages() as unknown as IntlMessages;
  const { contentItems } = messages.Roadmap.sections.progress;

  return (
    <RoadmapPageSection className={"bg-white"} title={t("title")}>
      {contentItems.map((contentRows, contentRowsIdx) => (
        <div
          className="grid-row grid-gap"
          key={`roadmap-what-were-working-on-${contentRowsIdx}`}
        >
          {contentRows.map((contentRowItem, contentRowItemIdx) => (
            <div
              className="margin-bottom-4 tablet:grid-col-6"
              key={`roadmap-what-were-working-on-${contentRowsIdx}-${contentRowItemIdx}`}
            >
              <h3>
                {t(`contentItems.${contentRowsIdx}.${contentRowItemIdx}.title`)}
              </h3>
              {t.rich(
                `contentItems.${contentRowsIdx}.${contentRowItemIdx}.content`,
                {
                  p: (chunks) => (
                    <p className="font-sans-2xs">{chunks}</p>
                  ),
                  linkGithub3045: gitHubLinkForIssue(3045),
                  linkGithub2875: gitHubLinkForIssue(2875),
                  linkGithub2640: gitHubLinkForIssue(2640),
                  linkGithub3348: gitHubLinkForIssue(3348),
                },
              )}
            </div>
          ))}
        </div>
      ))}
      <div className="display-flex flex-align-center">
        <USWDSIcon
          name="github"
          className="usa-icon usa-icon--size-3 text-primary-darker margin-right-05"
        />
        <p className="font-sans-xs margin-0">
          <GithubIssueLink chunks={t("link")} />
        </p>
      </div>
    </RoadmapPageSection>
  );
}
