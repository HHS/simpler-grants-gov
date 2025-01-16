"use client";

import clsx from "clsx";
import { QueryContext } from "src/app/[locale]/search/QueryProvider";
import { useSearchParamUpdater } from "src/hooks/useSearchParamUpdater";

import { useTranslations } from "next-intl";
import { useContext, useEffect, useRef, useState } from "react";
import { ErrorMessage, Icon } from "@trussworks/react-uswds";

interface SearchBarProps {
  query: string | null | undefined;
}

export default function SearchBar({ query }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { queryTerm, updateQueryTerm } = useContext(QueryContext);
  const { updateQueryParams, searchParams } = useSearchParamUpdater();
  const t = useTranslations("Search");
  const [validationError, setValidationError] = useState<String>();

  const handleSubmit = () => {
    if (queryTerm && queryTerm.length > 99) {
      setValidationError(t("tooLongError"));
      return;
    }
    updateQueryParams("", "query", queryTerm, false);
  };

  // if we have "refresh=true" query param, clear the input
  // this supports the expected refresh of the input if the user clicks the search link while on the search page
  useEffect(() => {
    if (searchParams.get("refresh") && inputRef.current) {
      updateQueryTerm("");
      inputRef.current.value = "";
    }
  }, [searchParams, updateQueryTerm]);

  // removes the "refresh" param once a user has dirtied the input
  useEffect(() => {
    if (searchParams.get("refresh") && inputRef.current?.value) {
      updateQueryParams("", "refresh");
    }
  }, [searchParams, updateQueryParams]);

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
          className={clsx("usa-input", "maxw-none", {
            "border-secondary-darker": !!validationError,
            "border-width-2px": !!validationError,
            "border-solid": !!validationError,
          })}
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
      {validationError && <ErrorMessage>{validationError}</ErrorMessage>}
    </div>
  );
}
