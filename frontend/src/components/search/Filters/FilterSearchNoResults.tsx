import { useTranslations } from "next-intl";

export function FilterSearchNoResults({
  useHeading = false,
}: {
  useHeading?: boolean;
}) {
  const t = useTranslations("Search.filters.searchNoResults");
  const suggestions = [
    t("suggestions.0"),
    t("suggestions.1"),
    t("suggestions.2"),
  ];
  return (
    <div data-testid="no-search-results">
      {useHeading ? (
        <h2 className="margin-top-4">{t("title")}</h2>
      ) : (
        <div className="text-bold">{t("title")}</div>
      )}

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
