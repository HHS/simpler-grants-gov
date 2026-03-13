import { ExternalRoutes } from "src/constants/routes";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { GridContainer } from "@trussworks/react-uswds";

const ClassicSearchBanner = () => {
  const t = useTranslations("Search");

  return (
    <div className="bg-primary-lightest line-height-body-2 font-body-3xs padding-y-1">
      <GridContainer>
        {t.rich("goToGG", {
          "search-link": (chunks) => <Link href="/search">{chunks}</Link>,
          "gg-link": (chunks) => (
            <a
              href={ExternalRoutes.GRANTS_HOME}
              target="_blank"
              rel="noopener noreferrer"
              className="usa-link--external"
            >
              {chunks}
            </a>
          ),
        })}
      </GridContainer>
    </div>
  );
};

export default ClassicSearchBanner;
