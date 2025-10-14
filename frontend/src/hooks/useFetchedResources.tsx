"use client";

import { createContext, PropsWithChildren, useContext } from "react";

export interface FetchedResourcesContext {
  [resourceName: string]: unknown;
}

const FetchedResourcesContext = createContext<FetchedResourcesContext>(
  {} as FetchedResourcesContext,
);

export const useFetchedResources = () => {
  const ctx = useContext(FetchedResourcesContext);
  if (ctx === null) {
    throw new Error(
      "useFetchedResources must be used within <FetchedResourcesProvider>",
    );
  }
  return ctx;
};

export function FetchedResourcesProvider({
  value,
  children,
}: PropsWithChildren<{ value: FetchedResourcesContext }>) {
  return (
    <FetchedResourcesContext.Provider value={value}>
      {children}
    </FetchedResourcesContext.Provider>
  );
}
