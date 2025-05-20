import { useMessages, useTranslations } from "next-intl";

import VisionPageSection from "src/components/vision/visionPageSection";

export default function VisionGoals() {
  const t = useTranslations("Vision.sections.goals");
  const messages = useMessages() as unknown as IntlMessages;
  const { contentItems } = messages.Vision.sections.goals;

  return (
    <VisionPageSection className={"bg-base-lightest"} title={t("title")}>
      {contentItems.map((contentRows, contentRowsIdx) => (
        <div className="grid-row grid-gap" key={`vision-goals-${contentRowsIdx}`}>
          {contentRows.map((contentRowItem, contentRowItemIdx) => (
            <div
              className="margin-bottom-4 tablet:grid-col-6"
              key={`vision-goals-${contentRowsIdx}-${contentRowItemIdx}`}
            >
              <h3>
                {t(`contentItems.${contentRowsIdx}.${contentRowItemIdx}.title`)}
              </h3>
              <p>
                {t(
                  `contentItems.${contentRowsIdx}.${contentRowItemIdx}.content`,
                )}
              </p>
            </div>
          ))}
        </div>
      ))}
    </VisionPageSection>
  );
}
