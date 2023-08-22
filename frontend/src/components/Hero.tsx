import { useTranslation } from "next-i18next";
import { GridContainer } from "@trussworks/react-uswds";

const Hero = () => {
  const { t } = useTranslation("common", {
    keyPrefix: "Hero",
  });

  return (
    <div
      data-testid="hero"
      className="bg-primary desktop:padding-y-15 tablet-lg:padding-y-10 tablet:padding-y-3 padding-y-1"
    >
      <GridContainer>
        <h1 className="text-white desktop:font-sans-3xl tablet:font-sans-2xl font-sans-xl">
          {t("title")}
        </h1>
        <p className="usa-intro desktop:font-sans-xl tablet:font-sans-lg font-sans-md">
          <span className="text-yellow text-bold">{t("beta")}</span>&nbsp;
          <span className="text-white">{t("content")}</span>
        </p>
      </GridContainer>
    </div>
  );
};

export default Hero;
