import { useMessages, useTranslations } from "next-intl";

import VisionPageSection from "src/components/vision/visionPageSection";

export default function VisionGoals() {
  const t = useTranslations("Vision.sections.goals");
  const messages = useMessages() as unknown as IntlMessages;
  const { contentItems } = messages.Vision.sections.goals;

  return (
    <VisionPageSection className={"bg-base-lightest"} title={t("title")}>
      <div className="margin-top-1" />
      {contentItems.map((contentRows, contentRowsIdx) => (
        <div className="grid-row" key={`vision-goals-${contentRowsIdx}`}>
          {contentRows.map((contentRowItem, contentRowItemIdx) => (
            <div
              className="margin-bottom-3 tablet-lg:grid-col-6 tablet-lg:padding-right-5"
              key={`vision-goals-${contentRowsIdx}-${contentRowItemIdx}`}
            >
              <h3 className="font-sans-sm margin-0 tablet:font-sans-md">
                {t(`contentItems.${contentRowsIdx}.${contentRowItemIdx}.title`)}
              </h3>
              <div className="font-sans-xs margin-top-1 line-height-sans-4">
                {t(
                  `contentItems.${contentRowsIdx}.${contentRowItemIdx}.content`,
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </VisionPageSection>
  );
}
