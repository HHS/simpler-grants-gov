import { useMessages, useTranslations } from "next-intl";

import { USWDSIcon } from "src/components/USWDSIcon";
import VisionPageSection from "src/components/vision/visionPageSection";

export default function VisionMission() {
  const t = useTranslations("Vision.sections.mission");
  const messages = useMessages() as unknown as IntlMessages;
  const { contentItems } = messages.Vision.sections.mission;

  type USWDSIconNames = "search" | "upload_file" | "trending_up";
  const uswdsIcons: USWDSIconNames[] = ["search", "upload_file", "trending_up"];

  return (
    <VisionPageSection className={"bg-white"} title={t("title")}>
      <p>{t("paragraph")}</p>
      <div className="grid-row grid-gap">
        {contentItems.map((contentRows, contentRowsIdx) => (
          <div
            className="tablet:grid-col-4"
            key={`vision-mission-${contentRowsIdx}`}
          >
            {contentRows.map((contentRowItem, contentRowItemIdx) => (
              <div
                className="margin-top-4"
                key={`vision-mission-${contentRowsIdx}-${contentRowItemIdx}`}
              >
                <USWDSIcon
                  name={uswdsIcons[contentRowsIdx]}
                  className="usa-icon--size-4 text-middle"
                  aria-label={`${uswdsIcons[contentRowsIdx]}-icon`}
                />
                <h3 className="margin-top-2">
                  {t(
                    `contentItems.${contentRowsIdx}.${contentRowItemIdx}.title`,
                  )}
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
      </div>
    </VisionPageSection>
  );
}
