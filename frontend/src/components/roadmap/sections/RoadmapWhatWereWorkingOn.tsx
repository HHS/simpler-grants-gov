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
    <RoadmapPageSection className="bg-base-lightest" title={t("title")}>
      {contentItems.map((contentItemIdx, index) => (
        <div
          className="margin-bottom-4"
          key={`roadmap-what-were-working-on-${index}`}
        >
          <h3>{t(`contentItems.${index}.title`)}</h3>
          {t.rich(`contentItems.${index}.content`, {
            p: (chunks) => <p className="font-sans-xs">{chunks}</p>,
            linkGithub7832: gitHubLinkForIssue(7832),
            linkGithub7830: gitHubLinkForIssue(7830),
            linkGithub7831: gitHubLinkForIssue(7831),
            linkGithub7790: gitHubLinkForIssue(7790),
            linkGithub7906: gitHubLinkForIssue(7906),
            fiderBoardLink: (chunks) => (
              <a
                href="https://simplergrants.fider.io/"
                target="_blank"
                className="usa-link--external"
              >
                {chunks}
              </a>
            ),
          })}
        </div>
      ))}
      <p>
        <Link
          target="_blank"
          className="usa-button usa-button--secondary"
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
