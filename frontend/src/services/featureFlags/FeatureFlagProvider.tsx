"use client";

import { FeatureFlags } from "src/services/FeatureFlagManager";

import { unstable_noStore } from "next/cache";
import { createContext } from "react";

export const FeatureFlagContext = createContext({} as FeatureFlags);

export default function FeatureFlagProvider({
  children,
  envVarFlags,
}: {
  children: React.ReactNode;
  envVarFlags: FeatureFlags;
}) {
  unstable_noStore();
  console.log("$$$ in provider", envVarFlags);
  return (
    <FeatureFlagContext.Provider value={envVarFlags}>
      {children}
    </FeatureFlagContext.Provider>
  );
}
