"use client";

import { useSearchParamUpdater } from "src/hooks/useSearchParamUpdater";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function ClientSideUrlUpdater({
  param,
  value,
  url,
  query,
}: {
  param?: string;
  value?: string;
  url?: string;
  query?: string;
}) {
  const router = useRouter();
  const { updateQueryParams, searchParams } = useSearchParamUpdater();
  // if query has been passed in, use that, otherwise pass through the current query
  const updatedQuery = query !== undefined ? query : searchParams.get("query");

  useEffect(() => {
    if (url) {
      router.push(url);
    }
  }, [url, router]);
  useEffect(() => {
    if (param && value !== undefined) {
      updateQueryParams(value, param, updatedQuery);
    }
  }, [param, value, updatedQuery, updateQueryParams]);
  return <></>;
}
