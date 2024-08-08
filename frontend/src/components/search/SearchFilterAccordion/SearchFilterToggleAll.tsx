"use client";
import { useTranslations } from "next-intl";

interface SearchFilterToggleAllProps {
  isAllSelected: boolean;
  isNoneSelected: boolean;
  onSelectAll?: () => void;
  onClearAll?: () => void;
}

const SearchFilterToggleAll: React.FC<SearchFilterToggleAllProps> = ({
  onSelectAll,
  onClearAll,
  isAllSelected,
  isNoneSelected,
}) => {
  const t = useTranslations("Search");

  return (
    <div className="grid-row">
      <div className="grid-col-fill">
        <button
          className="usa-button usa-button--unstyled font-sans-xs"
          onClick={(event) => {
            event.preventDefault();
            onSelectAll?.();
          }}
          disabled={isAllSelected}
        >
          {t("filterToggleAll.select")}
        </button>
      </div>
      <div className="grid-col-fill text-right">
        <button
          className="usa-button usa-button--unstyled font-sans-xs"
          onClick={(event) => {
            event.preventDefault();
            onClearAll?.();
          }}
          disabled={isNoneSelected}
        >
          {t("filterToggleAll.clear")}
        </button>
      </div>
    </div>
  );
};

export default SearchFilterToggleAll;
