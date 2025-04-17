import { useMessages, useTranslations } from "next-intl";

import { USWDSIcon } from "src/components/USWDSIcon";
import VisionPageSection from "src/components/vision/VisionPageSection";

export default function VisionMission() {
  const t = useTranslations("Vision.sections.mission");
  const messages = useMessages() as unknown as IntlMessages;
  const { contentItems } = messages.Vision.sections.mission;

  type USWDSIconNames = "search" | "upload_file" | "trending_up";
  const uswdsIcons: USWDSIconNames[] = ["search", "upload_file", "trending_up"];

  return (
    <VisionPageSection className={"bg-white"} title={t("title")}>
      <div className="margin-top-1" />
      <p className="margin-0 tablet-lg:margin-bottom-3 line-height-sans-4 tablet:font-sans-md">
        {t("paragraph")}
      </p>
      {contentItems.map((contentRows, contentRowsIdx) => (
        <div className="grid-row" key={`vision-mission-${contentRowsIdx}`}>
          {contentRows.map((contentRowItem, contentRowItemIdx) => (
            <div
              className="margin-bottom-3 grid-row tablet-lg:padding-right-5"
              key={`vision-mission-${contentRowsIdx}-${contentRowItemIdx}`}
            >
              <USWDSIcon
                name={uswdsIcons[contentRowsIdx]}
                height="50px"
                className="grid-col-1 usa-icon--size-3"
              />
              <h3 className="font-sans-sm margin-0 tablet:font-sans-md grid-col-3">
                {t(`contentItems.${contentRowsIdx}.${contentRowItemIdx}.title`)}
              </h3>
              <div className="font-sans-xs line-height-sans-4 grid-col">
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
