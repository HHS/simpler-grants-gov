"use client";

import { FeatureFlags } from "src/services/FeatureFlagManager";

import { createContext } from "react";

export const FeatureFlagContext = createContext({} as FeatureFlags);

export default function FeatureFlagProvider({
  children,
  envVarFlags,
}: {
  children: React.ReactNode;
  envVarFlags: FeatureFlags;
}) {
  console.log("$$$ in provider", envVarFlags);
  return (
    <FeatureFlagContext.Provider value={envVarFlags}>
      {children}
    </FeatureFlagContext.Provider>
  );
}
