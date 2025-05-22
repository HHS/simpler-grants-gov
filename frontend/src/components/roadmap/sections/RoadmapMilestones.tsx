import { useMessages, useTranslations } from "next-intl";
import { Accordion } from "@trussworks/react-uswds";

import RoadmapPageSection from "src/components/roadmap/RoadmapPageSection";

export default function RoadmapMilestones() {
  const t = useTranslations("Roadmap.sections.milestones");
  const messages = useMessages() as unknown as IntlMessages;
  const { contentItems, archivedRoadmapItems = {} } =
    messages.Roadmap.sections.milestones;

  return (
    <RoadmapPageSection className="bg-base-lightest" title={t("title")}>
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
              <p>{t(`contentItems.${key}.content`)}</p>
            </div>
          );
        })}
      {/* Late 2024 Section with Accordion */}
      <div className="margin-top-5">
        <Accordion
          items={[
            {
              title: t("archivedRoadmapTitle"),
              headingLevel: "h3",
              className: "",
              expanded: false,
              id: "archived-roadmap-content",
              content: (
                <div className="margin-top-2">
                  {archivedRoadmapItems &&
                    Object.keys(archivedRoadmapItems).map((key) => {
                      const title = t(`archivedRoadmapItems.${key}.title`);
                      return (
                        <>
                          <h4 key={`roadmap-milestones-late2024-${key}`}>
                            {title}
                          </h4>
                          <p>{t(`archivedRoadmapItems.${key}.content`)}</p>
                        </>
                      );
                    })}
                </div>
              ),
            },
          ]}
        />
      </div>
    </RoadmapPageSection>
  );
}
