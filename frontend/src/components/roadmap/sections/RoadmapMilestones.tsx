import { useMessages, useTranslations } from "next-intl";

import RoadmapPageSection from "src/components/roadmap/RoadmapPageSection";

export default function RoadmapMilestones() {
  const t = useTranslations("Roadmap.sections.milestones");
  const messages = useMessages() as unknown as IntlMessages;
  const { contentItems } = messages.Roadmap.sections.milestones;

  return (
    <RoadmapPageSection className="bg-base-lightest" title={t("title")}>
      <h3 className="margin-bottom-4">
        {t("contentTitle")}
      </h3>
      {Object.keys(contentItems).map((key) => {
        const title = t(`contentItems.${key}.title`);
        return (
          <div 
            className="margin-bottom-4"
            key={`roadmap-milestones-${title}-key`}
          >
            <h4>
              {title}
            </h4>
            <p>
              {t(`contentItems.${key}.content`)}
            </p>
          </div>
        );
      })}
    </RoadmapPageSection>
  );
}
