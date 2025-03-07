import { useMessages, useTranslations } from "next-intl";

import RoadmapPageSection from "./RoadmapPageSection";

export default function RoadmapMilestones() {
  const t = useTranslations("Roadmap.sections.milestones");
  const messages = useMessages() as unknown as IntlMessages;
  const { contentItems } = messages.Roadmap.sections.milestones;

  return (
    <RoadmapPageSection
      sectionTitle={t("title")}
      sectionContent={
        <>
          <h2 className="font-sans-md margin-top-0 desktop:font-sans-lg">
            {t("contentTitle")}
          </h2>
          {Object.keys(contentItems).map((key) => {
            const title = t(`contentItems.${key}.title`);
            return (
              <div
                className="roadmap-content-item-content"
                key={`roadmap-milestones-${title}-key`}
              >
                <h3 className="font-sans-sm margin-0 tablet:font-sans-md">
                  {title}
                </h3>
                <p className="roadmap-content-item-content-p">
                  {t(`contentItems.${key}.content`)}
                </p>
              </div>
            );
          })}
        </>
      }
    />
  );
}
