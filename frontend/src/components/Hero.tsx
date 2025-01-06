import { ExternalRoutes } from "src/constants/routes";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { GridContainer } from "@trussworks/react-uswds";

import { USWDSIcon } from "./USWDSIcon";

const Hero = () => {
  const t = useTranslations("Hero");

  return (
    <div
      data-testid="hero"
      className="hero bg-primary-darkest text-white overflow-hidden"
    >
      <GridContainer className="hero--container padding-y-1 tablet:padding-y-3 tablet-lg:padding-y-10 desktop-lg:padding-top-15 desktop-lg:padding-bottom-10 position-relative">
        <div className="hero--text position-relative z-100">
          <h1 className="text-ls-neg-2 tablet:font-sans-2xl desktop-lg:font-sans-3xl desktop-lg:margin-top-2 text-balance">
            <span>{t("title")}</span>
          </h1>
          <p className="usa-intro line-height-sans-3 font-sans-md tablet:font-sans-lg text-balance">
            {t("content")}
          </p>
        </div>
        <Link
          href="/search"
          passHref
          className="usa-button usa-button--secondary usa-button--big margin-bottom-2"
        >
          {t("search_link")}
        </Link>
        <span className="usa-dark-background bg-transparent">
          <Link
            className="usa-button usa-button--small usa-button--unstyled usa-button--inverse desktop:position-absolute top-3 right-0 margin-y-1 desktop:margin-y-3 desktop:margin-x-4"
            href={ExternalRoutes.GITHUB_REPO}
            target="_blank"
          >
            <USWDSIcon
              name="github"
              className="usa-icon usa-icon--size-3"
              aria-label="Github"
            />
            {t("github_link")}
          </Link>
        </span>
      </GridContainer>
    </div>
  );
};

export default Hero;
