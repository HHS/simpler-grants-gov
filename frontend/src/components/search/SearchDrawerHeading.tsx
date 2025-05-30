import { searchFilterNames } from "src/types/search/searchFilterTypes";

import { useTranslations } from "next-intl";

import { ClearSearchButton } from "./ClearSearchButton";

export function SearchDrawerHeading() {
  const t = useTranslations("Search.drawer");
  return (
    <div className="display-flex">
      <div className="flex-2">{t("title")}</div>
      <div className="flex-1">
        <ClearSearchButton
          buttonText={t("clearAll")}
          paramsToClear={[...searchFilterNames]}
        />
      </div>
    </div>
  );
}
