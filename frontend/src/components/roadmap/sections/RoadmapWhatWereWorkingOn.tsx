import { ExternalRoutes } from "src/constants/routes";

import { useMessages, useTranslations } from "next-intl";
import Link from "next/link";

import { gitHubLinkForIssue } from "src/components/GithubLink";
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
                  p: (chunks) => <p className="font-sans-2xs">{chunks}</p>,
                  linkGithub4571: gitHubLinkForIssue(4571),
                  linkGithub4577: gitHubLinkForIssue(4577),
                  linkGithub4572: gitHubLinkForIssue(4572),
                  linkGithub4575: gitHubLinkForIssue(4575),
                  linkGithub4576: gitHubLinkForIssue(4576),
                  linkGithub4579: gitHubLinkForIssue(4579),
                },
              )}
            </div>
          ))}
        </div>
      ))}
      <p>
        <Link
          target="_blank"
          className="usa-link--external"
          href={ExternalRoutes.GITHUB_REPO_DELIVERABLES}
        >
          <USWDSIcon
            name="github"
            className="usa-icon usa-icon--size-3 margin-right-05 text-middle"
          />
          {t("link")}
        </Link>
      </p>
    </RoadmapPageSection>
  );
}
