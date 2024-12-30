import { useTranslations } from "next-intl";
import React from "react";
import { GridContainer } from "@trussworks/react-uswds";

const SearchCallToAction: React.FC = () => {
  const t = useTranslations("Search");

  return (
    <>
      {/* <BetaAlert /> */}
      <GridContainer>
        <h1 className="margin-0 tablet-lg:font-sans-xl desktop-lg:font-sans-2xl">
          {t("callToAction.title")}
        </h1>
      </GridContainer>
    </>
  );
};

export default SearchCallToAction;
