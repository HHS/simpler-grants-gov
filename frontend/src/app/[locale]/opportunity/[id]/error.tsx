"use client";

import { useEffect } from "react";

import BetaAlert from "src/components/BetaAlert";
import SearchErrorAlert from "src/components/search/error/SearchErrorAlert";

export default function OpportunityError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <>
      <BetaAlert />
      <SearchErrorAlert />
    </>
  );
}
