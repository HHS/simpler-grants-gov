import { useMessages, useTranslations } from "next-intl";

import GithubIssueLink, { gitHubLinkForIssue } from "src/components/GithubLink";
import RoadmapPageSection from "src/components/roadmap/RoadmapPageSection";

export default function RoadmapWhatWereWorkingOn() {
  const t = useTranslations("Roadmap.sections.progress");
  const messages = useMessages() as unknown as IntlMessages;
  const { contentItems } = messages.Roadmap.sections.progress;

  return (
    <RoadmapPageSection
      sectionTitle={t("title")}
      extraClasses="bg-white"
      sectionContent={
        <>
          <div className="margin-top-1" />
          {contentItems.map((i, j) => (
            <div className="grid-row" key={`roadmap-what-were-working-on-${j}`}>
              {i.map((k, l) => (
                <div
                  className="margin-bottom-3 tablet-lg:grid-col-6 tablet-lg:padding-right-5"
                  key={`roadmap-what-were-working-on-${j}-${l}`}
                >
                  <h3 className="font-sans-sm margin-0 tablet:font-sans-md">
                    {t(`contentItems.${j}.${l}.title`)}
                  </h3>
                  <div className="font-sans-xs margin-top-1 line-height-sans-4">
                    {t.rich(`contentItems.${j}.${l}.content`, {
                      p: (chunks) => (
                        <p className=" font-sans-xs margin-y-05">{chunks}</p>
                      ),
                      linkGithub3045: gitHubLinkForIssue(3045),
                      linkGithub2875: gitHubLinkForIssue(2875),
                      linkGithub2640: gitHubLinkForIssue(2640),
                      linkGithub3348: gitHubLinkForIssue(3348),
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
          <h3 className="font-sans-xs margin-0">
            <GithubIssueLink chunks={t("link")} />
          </h3>
        </>
      }
    />
  );
}
