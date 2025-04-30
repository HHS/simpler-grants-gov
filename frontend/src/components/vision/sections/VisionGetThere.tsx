import { useTranslations } from "next-intl";

import VisionPageSection from "src/components/vision/visionPageSection";

export default function VisionGetThere() {
  const t = useTranslations("Vision.sections.geThere");

  return (
    <VisionPageSection className="bg-white" title={t("title")}>
      <h3>{t("contentTitle")}</h3>
      <div>
        <p>{t("paragraph1")}</p>
        <p>{t("paragraph2")}</p>
        <p>
          <a
            className="font-sans-xs line-height-sans-4 "
            target="_blank"
            rel="noopener noreferrer"
            href="https://wiki.simpler.grants.gov/design-and-research/user-research/grants.gov-archetypes"
          >
            {t("linkText1")}
          </a>
        </p>
        <p>
          <a
            className="font-sans-xs line-height-sans-4"
            target="_blank"
            rel="noopener noreferrer"
            href="https://ethn.io/91822"
          >
            {t("linkText2")}
          </a>
        </p>
      </div>
    </VisionPageSection>
  );
}
