import { ExternalRoutes } from "src/constants/routes";

import { useMessages, useTranslations } from "next-intl";
import Link from "next/link";
import { Accordion } from "@trussworks/react-uswds";

import RoadmapPageSection from "src/components/roadmap/RoadmapPageSection";

export default function RoadmapMilestones() {
  const t = useTranslations("Roadmap.sections.milestones");
  const messages = useMessages() as unknown as IntlMessages;
  const { contentItems, archivedRoadmapSections } =
    messages.Roadmap.sections.milestones;

  return (
    <RoadmapPageSection title={t("title")}>
      <p>
        <Link
          target="_blank"
          className="usa-link--external"
          href={ExternalRoutes.WIKI_RELEASE_NOTES}
        >
          {t("releaseNotesLink")}
        </Link>
      </p>

      {/* Early 2025 Section - Always visible */}
      <h3 className="margin-bottom-4">{t("contentTitle")}</h3>
      {/* Render Early 2025 content items */}

      {contentItems &&
        Object.keys(contentItems).map((key) => {
          const title = t(`contentItems.${key}.title`);
          return (
            <div
              className="margin-bottom-4"
              key={`roadmap-milestones-${title}-key`}
            >
              <h4>{title}</h4>
              {t.rich(`contentItems.${key}.content`, {
                p: (chunks) => <p className="font-sans-xs">{chunks}</p>,
                releaseNotesLink: (chunks) => (
                  <a
                    target="_blank"
                    className="usa-link--external"
                    href={ExternalRoutes.WIKI_RELEASE_NOTES}
                  >
                    {chunks}
                  </a>
                ),
                commonGrantsProtocolLink: (chunks) => (
                  <a
                    target="_blank"
                    className="usa-link--external"
                    href={ExternalRoutes.COMMON_GRANTS}
                  >
                    {chunks}
                  </a>
                ),
              })}
            </div>
          );
        })}
      {/* Accordion sections */}
      {archivedRoadmapSections &&
        archivedRoadmapSections.map((_archivedSection, archivedSectionIdx) => {
          const sectionTitle = t(
            `archivedRoadmapSections.${archivedSectionIdx}.sectionTitle`,
          );
          return (
            <div
              className="margin-bottom-4"
              key={`archived-roadmap-sections-${sectionTitle}-key`}
            >
              <Accordion
                bordered
                items={[
                  {
                    title: sectionTitle,
                    headingLevel: "h3",
                    className: "",
                    expanded: false,
                    id: `archived-roadmap-accordion--${archivedSectionIdx}`,
                    content: (
                      <div className="margin-top-2">
                        {archivedRoadmapSections[
                          archivedSectionIdx
                        ].sectionItems.map((_archivedItem, archivedItemIdx) => {
                          return (
                            <div
                              key={`archived-roadmap-sections-${sectionTitle}-sections-${archivedItemIdx}-key`}
                              className="margin-bottom-4"
                            >
                              <h4>
                                {t(
                                  `archivedRoadmapSections.${archivedSectionIdx}.sectionItems.${archivedItemIdx}.title`,
                                )}
                              </h4>
                              {t.rich(
                                `archivedRoadmapSections.${archivedSectionIdx}.sectionItems.${archivedItemIdx}.content`,
                                {
                                  p: (chunks) => (
                                    <p className="font-sans-xs">{chunks}</p>
                                  ),
                                },
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          );
        })}
    </RoadmapPageSection>
  );
}
