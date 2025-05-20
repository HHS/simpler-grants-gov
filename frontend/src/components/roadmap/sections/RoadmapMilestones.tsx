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
      <h2 className="font-sans-md margin-0 margin-top-1 tablet:font-sans-lg">
        {t("contentTitle")}
      </h2>
      {/* Render Early 2025 content items */}

      {contentItems &&
        Object.keys(contentItems).map((key) => {
          const title = t(`contentItems.${key}.title`);
          return (
            <div key={`roadmap-milestones-${title}-key`}>
              <h3 className="font-sans-sm margin-top-3 margin-bottom-1 tablet:font-sans-md">
                {title}
              </h3>
              <p className="font-sans-xs margin-0 margin-bottom-0 line-height-sans-4">
                {t(`contentItems.${key}.content`)}
              </p>
            </div>
          );
        })}
      {/* Late 2024 Section with Accordion */}
      <div className="margin-top-5">
        <Accordion
          items={[
            {
              title: t("archivedRoadmapTitle"),
              headingLevel: "h2",
              className: "font-sans-md tablet:font-sans-lg",
              expanded: false,
              id: "archived-roadmap-content",
              content: (
                <div className="margin-top-2">
                  {archivedRoadmapItems &&
                    Object.keys(archivedRoadmapItems).map((key) => {
                      const title = t(`archivedRoadmapItems.${key}.title`);
                      return (
                        <div key={`roadmap-milestones-late2024-${key}`}>
                          <h3 className="font-sans-sm margin-top-3 margin-bottom-1 tablet:font-sans-md">
                            {title}
                          </h3>
                          <p className="font-sans-xs margin-0 margin-bottom-0 line-height-sans-4">
                            {t(`archivedRoadmapItems.${key}.content`)}
                          </p>
                        </div>
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
