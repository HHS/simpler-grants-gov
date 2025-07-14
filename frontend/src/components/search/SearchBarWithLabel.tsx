"use client";

import { useTranslations } from "next-intl";
import { Label } from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/USWDSIcon";
import SearchBar from "./SearchBar";

interface SearchBarProps {
  queryTermFromParent?: string | null;
  tableView?: boolean;
}

export function LegacySearchLabel() {
  const t = useTranslations("Search.bar");
  return (
    <label
      htmlFor="query"
      className="font-sans-lg display-block margin-bottom-2"
    >
      {t.rich("label", {
        strong: (chunks) => <span className="text-bold">{chunks}</span>,
        small: (chunks) => (
          <small className="font-sans-sm display-inline-block">{chunks}</small>
        ),
      })}
    </label>
  );
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

export const LegacySearchBar = ({
  queryTermFromParent,
  tableView = false,
}: SearchBarProps) => {
  return (
    <SearchBar
      queryTermFromParent={queryTermFromParent}
      tableView={tableView}
      LabelComponent={LegacySearchLabel}
    />
  );
};

export const NewSearchBar = ({
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
