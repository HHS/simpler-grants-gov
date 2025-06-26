import { useTranslations } from "next-intl";

export function FilterSearchNoResults() {
  const t = useTranslations("Search.filters.searchNoResults");
  const suggestions = [
    t("suggestions.0"),
    t("suggestions.1"),
    t("suggestions.2"),
  ];
  return (
    <div>
      <div className="text-bold">{t("title")}</div>
      <div>
        {t("heading")}
        <ul>
          {suggestions.map((suggestion, i) => (
            <li key={i}>{suggestion}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
