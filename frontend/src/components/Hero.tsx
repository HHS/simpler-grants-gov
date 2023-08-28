import { useTranslation } from "next-i18next";
import { GridContainer } from "@trussworks/react-uswds";

const Hero = () => {
  const { t } = useTranslation("common", {
    keyPrefix: "Hero",
  });

  return (
    <div data-testid="hero" className="usa-dark-background bg-primary">
      <GridContainer className="padding-y-1 tablet:padding-y-3 tablet-lg:padding-y-10 desktop-lg:padding-y-15">
        <h1 className="tablet:font-sans-2xl desktop-lg:font-sans-3xl text-ls-neg-2">
          <span>{t("title")}</span>
        </h1>
        <p className="usa-intro font-sans-md tablet:font-sans-lg desktop-lg:font-sans-xl">
          <span className="text-yellow text-bold">{t("beta")}</span>&nbsp;
          {t("content")}
        </p>
      </GridContainer>
    </div>
  );
};

export default Hero;
