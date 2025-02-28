"use client";

import { useFeatureFlags } from "src/hooks/useFeatureFlags";
import { useUser } from "src/services/auth/useUser";

import { SaveSearchModal } from "./SaveSearchModal";

export function SaveSearchPanel() {
  const { checkFeatureFlag } = useFeatureFlags();
  const { user } = useUser();
  if (!checkFeatureFlag("savedSearchesOn") || !user?.token) {
    return <></>;
  }
  return <SaveSearchModal />;
}
