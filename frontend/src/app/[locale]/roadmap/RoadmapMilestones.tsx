import { useMessages, useTranslations } from "next-intl";

import RoadmapPageSection from "./RoadmapPageSection";

export default function RoadmapMilestones() {
  const t = useTranslations("Roadmap.sections.milestones");
  const messages = useMessages() as unknown as IntlMessages;
  const { contentItems } = messages.Roadmap.sections.milestones;

  return (
    <RoadmapPageSection
      sectionTitle={t("title")}
      sectionBackgroundColorClass="bg-base-lightest"
      sectionContent={
        <>
          <h2>{t("contentTitle")}</h2>
          {Object.keys(contentItems).map((key) => {
            const title = t(`contentItems.${key}.title`);
            const content = t.rich(`contentItems.${key}.content`, {
              p: (chunks) => (
                <p className="font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
                  {chunks}
                </p>
              ),
            });
            return (
              <div key={`roadmap-milestones-${title}-key`}>
                <h3>{title}</h3>
                {content}
              </div>
            );
          })}
        </>
      }
    />
  );
}
