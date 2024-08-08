import { GridContainer } from "@trussworks/react-uswds";
import React from "react";
import { useTranslations } from "next-intl";

const SearchCallToAction: React.FC = () => {
  const t = useTranslations("Search");

  return (
    <>
      {/* <BetaAlert /> */}
      <GridContainer>
        <h1 className="margin-0 tablet-lg:font-sans-xl desktop-lg:font-sans-2xl">
          {t("callToAction.title")}
        </h1>
        <p className="font-serif-md tablet-lg:font-serif-lg usa-intro margin-top-2">
          {t.rich("callToAction.description", {
            mail: (chunks) => <a href="mailto:simpler@grants.gov">{chunks}</a>,
          })}
        </p>
      </GridContainer>
    </>
  );
};

export default SearchCallToAction;
