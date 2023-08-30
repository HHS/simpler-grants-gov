import { ExternalRoutes } from "src/constants/routes";

import { useTranslation } from "next-i18next";
import Link from "next/link";
import { GridContainer, Icon } from "@trussworks/react-uswds";

const Hero = () => {
  const { t } = useTranslation("common", {
    keyPrefix: "Hero",
  });

  return (
    <div data-testid="hero" className="usa-dark-background bg-primary">
      <GridContainer className="padding-y-1 tablet:padding-y-3 tablet-lg:padding-y-10 desktop-lg:padding-y-15 position-relative">
        <h1 className="tablet:font-sans-2xl desktop-lg:font-sans-3xl text-ls-neg-2">
          <span>{t("title")}</span>
        </h1>
        <p className="usa-intro font-sans-md tablet:font-sans-lg desktop-lg:font-sans-xl">
          <span className="text-yellow text-bold">{t("beta")}</span>&nbsp;
          {t("content")}
        </p>
        <Link
          className="usa-button usa-button--outline usa-button--inverse font-sans-2xs tablet:font-sans-md margin-bottom-3 desktop:position-absolute top-3 right-0 desktop:margin-y-3 desktop:margin-x-4"
          href={ExternalRoutes.GITHUB_REPO}
          target="_blank"
        >
          <Icon.Github className="usa-icon usa-icon--size-3 margin-right-1 text-middle tablet:margin-top-neg-2px" />
          {t("github_link")}
        </Link>
      </GridContainer>
    </div>
  );
};

export default Hero;
