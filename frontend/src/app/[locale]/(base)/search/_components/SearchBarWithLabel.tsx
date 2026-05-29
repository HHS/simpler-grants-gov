"use client";

import { useTranslations } from "next-intl";
import { Label } from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/USWDSIcon";
import SearchBar from "./SearchBar";

interface SearchBarProps {
  queryTermFromParent?: string | null;
  tableView?: boolean;
}

export function SearchLabel() {
  const t = useTranslations("Search.bar");
  return (
    <Label htmlFor="query" className="maxw-full margin-bottom-2">
      <USWDSIcon
        name="lightbulb_outline"
        className="usa-icon--size-3 text-middle margin-right-05"
      />
      <span className="text-middle">{t("exclusionTip")}</span>
    </Label>
  );
}

export const SearchBarWithLabel = ({
  queryTermFromParent,
  tableView = false,
}: SearchBarProps) => {
  return (
    <SearchBar
      queryTermFromParent={queryTermFromParent}
      tableView={tableView}
      LabelComponent={SearchLabel}
    />
  );
};
