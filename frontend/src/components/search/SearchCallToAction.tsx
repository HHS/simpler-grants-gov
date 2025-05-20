import { useTranslations } from "next-intl";
import React from "react";
import { GridContainer } from "@trussworks/react-uswds";

const SearchCallToAction: React.FC = () => {
  const t = useTranslations("Search");

  return (
    <>
      <GridContainer>
        <h1>
          {t("callToAction.title")}
        </h1>
      </GridContainer>
    </>
  );
};

export default SearchCallToAction;
