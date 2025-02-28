"use client";

import { useFeatureFlags } from "src/hooks/useFeatureFlags";

import { SaveSearchModal } from "./SaveSearchModal";

export function SaveSearchPanel() {
  const { checkFeatureFlag } = useFeatureFlags();
  if (!checkFeatureFlag("savedSearchesOn")) {
    return <></>;
  }
  return <SaveSearchModal />;
}
