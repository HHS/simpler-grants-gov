"use client";

import { QueryContext } from "src/app/[locale]/search/QueryProvider";
import { useSearchParamUpdater } from "src/hooks/useSearchParamUpdater";

import { useTranslations } from "next-intl";
import { useContext, useEffect, useRef } from "react";
import { Icon } from "@trussworks/react-uswds";

interface SearchBarProps {
  query: string | null | undefined;
}

export default function SearchBar({ query }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { queryTerm, updateQueryTerm } = useContext(QueryContext);
  const { updateQueryParams, searchParams } = useSearchParamUpdater();
  const t = useTranslations("Search");

  const handleSubmit = () => {
    updateQueryParams("", "query", queryTerm, false);
  };

  useEffect(() => {
    if (searchParams.get("refresh") && inputRef.current) {
      updateQueryTerm("");
      inputRef.current.value = "";
    }
  }, [searchParams, updateQueryTerm]);

  useEffect(() => {
    if (searchParams.get("refresh") && queryTerm) {
      updateQueryParams("", "refresh");
    }
  }, [queryTerm, searchParams, updateQueryParams]);

  return (
    <div className="margin-top-5 margin-bottom-2">
      <label
        htmlFor="query"
        className="font-sans-lg display-block margin-bottom-2"
      >
        {t.rich("bar.label", {
          strong: (chunks) => <span className="text-bold">{chunks}</span>,
          small: (chunks) => (
            <small className="display-inline-block">{chunks}</small>
          ),
        })}
      </label>
      <div className="usa-search usa-search--big" role="search">
        <input
          ref={inputRef}
          className="usa-input maxw-none"
          id="query"
          type="search"
          name="query"
          defaultValue={query || ""}
          onChange={(e) => updateQueryTerm(e.target?.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
        />
        <button className="usa-button" type="submit" onClick={handleSubmit}>
          <span className="usa-search__submit-text">{t("bar.button")} </span>
          <Icon.Search
            className="usa-search__submit-icon"
            size={4}
            aria-label="Search"
          />
        </button>
      </div>
    </div>
  );
}
