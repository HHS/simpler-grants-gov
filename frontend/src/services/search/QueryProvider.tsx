"use client";

import { useSearchParams } from "next/navigation";
import { createContext, useCallback, useMemo, useState } from "react";

interface QueryContextParams {
  queryTerm: string | null | undefined;
  updateQueryTerm: (term: string) => void;
  totalPages: string | null | undefined;
  updateTotalPages: (page: string) => void;
  totalResults: string;
  updateTotalResults: (total: string) => void;
  updateLocalAndOrParam: (value: string) => void;
  localAndOrParam: string;
}

export const QueryContext = createContext({} as QueryContextParams);

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams() || undefined;
  const defaultTerm = searchParams?.get("query");
  const [queryTerm, setQueryTerm] = useState(defaultTerm);
  const [totalPages, setTotalPages] = useState("na");
  const [totalResults, setTotalResults] = useState("");
  const [localAndOrParam, setLocalAndOrParam] = useState("");

  const updateQueryTerm = useCallback((term: string) => {
    setQueryTerm(term);
  }, []);

  const updateTotalResults = useCallback((total: string) => {
    setTotalResults(total);
  }, []);

  const updateTotalPages = useCallback((page: string) => {
    setTotalPages(page);
  }, []);

  // added here rather than in the useSearchParamUpdater hook since this value needs to be
  // consistent across the app, not just per hook invocation. See https://github.com/HHS/simpler-grants-gov/issues/5276 for more
  const updateLocalAndOrParam = useCallback((paramValue: string) => {
    setLocalAndOrParam(paramValue);
  }, []);

  const contextValue = useMemo(
    () => ({
      queryTerm,
      updateQueryTerm,
      totalPages,
      updateTotalPages,
      totalResults,
      updateTotalResults,
      updateLocalAndOrParam,
      localAndOrParam,
    }),
    [
      queryTerm,
      updateQueryTerm,
      totalPages,
      updateTotalPages,
      totalResults,
      updateTotalResults,
      updateLocalAndOrParam,
      localAndOrParam,
    ],
  );

  return (
    <QueryContext.Provider value={contextValue}>
      {children}
    </QueryContext.Provider>
  );
}
