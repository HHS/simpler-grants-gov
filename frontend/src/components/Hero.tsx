import { ExternalRoutes } from "src/constants/routes";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { GridContainer } from "@trussworks/react-uswds";

import { USWDSIcon } from "./USWDSIcon";

const Hero = () => {
  const t = useTranslations("Hero");

  return (
    <div data-testid="hero" className="usa-dark-background bg-primary">
      <GridContainer className="padding-y-1 tablet:padding-y-3 tablet-lg:padding-y-10 desktop-lg:padding-y-15 position-relative">
        <h1 className="text-ls-neg-2 tablet:font-sans-2xl desktop-lg:font-sans-3xl desktop-lg:margin-top-2">
          <span>{t("title")}</span>
        </h1>
        <p className="usa-intro line-height-sans-3 font-sans-md tablet:font-sans-lg desktop-lg:font-sans-xl desktop-lg:margin-bottom-0">
          {t("content")}
        </p>
        <Link
          className="usa-button usa-button--outline usa-button--inverse font-sans-2xs tablet:font-sans-md margin-bottom-3 desktop:position-absolute top-3 right-0 desktop:margin-y-3 desktop:margin-x-4"
          href={ExternalRoutes.GITHUB_REPO}
          target="_blank"
        >
          <USWDSIcon
            name="github"
            className="usa-icon usa-icon--size-3 margin-right-1 text-middle tablet:margin-top-neg-2px"
            aria-label="Github"
          />
          {t("github_link")}
        </Link>
      </GridContainer>
    </div>
  );
};

export default Hero;
