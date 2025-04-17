import { useTranslations } from "next-intl";

import VisionPageSection from "src/components/vision/VisionPageSection";

export default function VisionGetThere() {
  const t = useTranslations("Vision.sections.get_there");

  return (
    <VisionPageSection className="bg-white" title={t("title")}>
      <h3 className="margin-top-3 margin-bottom-1 tablet:font-sans-md">
        {t("contentTitle")}
      </h3>
      <div>
        <p className="margin-0 tablet-lg:margin-bottom-2 line-height-sans-4 tablet:font-sans-md">
          {t("paragraph_1")}
        </p>
        <p className="margin-0 tablet-lg:margin-bottom-2 line-height-sans-4 tablet:font-sans-md">
          {t("paragraph_2")}
        </p>
        <div>
          <a
            className="font-sans-xs line-height-sans-4 "
            target="_blank"
            rel="noopener noreferrer"
            href="https://wiki.simpler.grants.gov/design-and-research/user-research/grants.gov-archetypes"
          >
            {t("link_text_1")}
          </a>
        </div>
        <div className={"margin-top-2"}>
          <a
            className="font-sans-xs line-height-sans-4"
            target="_blank"
            rel="noopener noreferrer"
            href="https://ethn.io/91822"
          >
            {t("link_text_2")}
          </a>
        </div>
      </div>
    </VisionPageSection>
  );
}
