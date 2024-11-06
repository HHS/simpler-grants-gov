"use client";

import { QueryContext } from "src/app/[locale]/search/QueryProvider";
import { useSearchParamUpdater } from "src/hooks/useSearchParamUpdater";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useContext, useEffect } from "react";
import { Icon } from "@trussworks/react-uswds";

interface SearchBarProps {
  query: string | null | undefined;
}

// what can we look at to determine if there is a page refresh so we can clear the queryTerm
// let's try making the nav take you to like "search-opportunities?navLink=true" which redirects to '/search" but we've already captured the state to know to reset the form????
export default function SearchBar({ query }: SearchBarProps) {
  const { queryTerm, updateQueryTerm } = useContext(QueryContext);
  const { updateQueryParams, searchParams } = useSearchParamUpdater();
  const t = useTranslations("Search");

  const handleSubmit = () => {
    updateQueryParams("", "query", queryTerm, false);
  };

  console.log("!!! search bar render query", query);
  console.log("!!! search bar render queryTerm", queryTerm);

  // useEffect(() => {
  //   console.log("CHECKING", searchParams.get("refresh"));
  //   if (searchParams.get("refresh")) {
  //     console.log("UPDATDIHNG");
  //     updateQueryTerm("");
  //   }
  // }, [searchParams, updateQueryTerm]);

  // useEffect(() => console.log("***"), []);

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
