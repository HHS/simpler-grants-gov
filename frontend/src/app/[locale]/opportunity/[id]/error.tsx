"use client";

import BetaAlert from "src/components/BetaAlert";
import SearchErrorAlert from "src/components/search/error/SearchErrorAlert";

export default function OpportunityError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <>
      <BetaAlert />
      <SearchErrorAlert />
    </>
  );
}
