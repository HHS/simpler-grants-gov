import { useTranslations } from "next-intl";
import React from "react";

const SearchCallToAction = () => {
  const t = useTranslations("Search");

  return <h1 className="margin-top-0">{t("callToAction.title")}</h1>;
};

export default SearchCallToAction;
