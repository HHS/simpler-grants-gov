import { useMessages, useTranslations } from "next-intl";

import RoadmapPageSection from "src/components/roadmap/RoadmapPageSection";

export default function RoadmapMilestones() {
  const t = useTranslations("Roadmap.sections.milestones");
  const messages = useMessages() as unknown as IntlMessages;
  const { contentItems } = messages.Roadmap.sections.milestones;

  return (
    <div className="bg-base-lightest">
      <RoadmapPageSection title={t("title")}>
        <h2 className="font-sans-md margin-0 margin-top-1 tablet:font-sans-lg">
          {t("contentTitle")}
        </h2>
        {Object.keys(contentItems).map((key) => {
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
      </RoadmapPageSection>
    </div>
  );
}
