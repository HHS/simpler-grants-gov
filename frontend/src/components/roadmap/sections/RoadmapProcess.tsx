import { useMessages, useTranslations } from "next-intl";

import RoadmapPageSection from "src/components/roadmap/RoadmapPageSection";

export default function RoadmapProcess() {
  const t = useTranslations("Roadmap.sections.process");
  const messages = useMessages() as unknown as IntlMessages;
  const { contentItems } = messages.Roadmap.sections.process;

  return (
    <RoadmapPageSection
      sectionTitle={t("title")}
      extraClasses="bg-white"
      sectionContent={
        <>
          <p className="margin-top-0 line-height-sans-4">
            {t("sectionSummary")}
          </p>
          {Object.keys(contentItems).map((key) => {
            return (
              <div
                className="roadmap-content-item-content"
                key={`roadmap-process-${key}`}
              >
                <h3 className="font-sans-sm margin-0 tablet:font-sans-md">
                  {t(`contentItems.${key}.title`)}
                </h3>
                <p className="font-sans-xs margin-top-1 line-height-sans-4">
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
