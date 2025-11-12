"use client";

import { useSearchParamUpdater } from "src/hooks/useSearchParamUpdater";
import { useUser } from "src/services/auth/useUser";
import { addCacheBuster } from "src/utils/cacheBuster";

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
  const { user } = useUser();
  const { updateQueryParams, searchParams } = useSearchParamUpdater();
  // if query has been passed in, use that, otherwise pass through the current query
  const updatedQuery = query !== undefined ? query : searchParams.get("query");

  useEffect(() => {
    if (url) {
      // Check authentication using user object - must have a token
      const isAuthenticated = !!(user && user.token);

      // Add cache buster for authenticated users
      const finalUrl = isAuthenticated ? addCacheBuster(url) : url;
      router.push(finalUrl);
    }
  }, [url, router, user]);
  useEffect(() => {
    if (param && value !== undefined) {
      updateQueryParams(value, param, updatedQuery);
    }
  }, [param, value, updatedQuery, updateQueryParams]);
  return <></>;
}
