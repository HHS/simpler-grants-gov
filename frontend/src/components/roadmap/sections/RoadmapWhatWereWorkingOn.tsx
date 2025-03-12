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
      <div className="margin-top-1" />
      {contentItems.map((contentRows, contentRowsIdx) => (
        <div
          className="grid-row"
          key={`roadmap-what-were-working-on-${contentRowsIdx}`}
        >
          {contentRows.map((contentRowItem, contentRowItemIdx) => (
            <div
              className="margin-bottom-3 tablet-lg:grid-col-6 tablet-lg:padding-right-5"
              key={`roadmap-what-were-working-on-${contentRowsIdx}-${contentRowItemIdx}`}
            >
              <h3 className="font-sans-sm margin-0 tablet:font-sans-md">
                {t(`contentItems.${contentRowsIdx}.${contentRowItemIdx}.title`)}
              </h3>
              <div className="font-sans-xs margin-top-1 line-height-sans-4">
                {t.rich(
                  `contentItems.${contentRowsIdx}.${contentRowItemIdx}.content`,
                  {
                    p: (chunks) => (
                      <p className=" font-sans-xs margin-y-05">{chunks}</p>
                    ),
                    linkGithub3045: gitHubLinkForIssue(3045),
                    linkGithub2875: gitHubLinkForIssue(2875),
                    linkGithub2640: gitHubLinkForIssue(2640),
                    linkGithub3348: gitHubLinkForIssue(3348),
                  },
                )}
              </div>
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
