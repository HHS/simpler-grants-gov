"use client";

import { AuthorizedData } from "src/types/authTypes";

import { createContext, PropsWithChildren, useContext } from "react";

const FetchedResourcesContext = createContext<AuthorizedData>(
  {} as AuthorizedData,
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
}: PropsWithChildren<{ value: AuthorizedData }>) {
  return (
    <FetchedResourcesContext.Provider value={value}>
      {children}
    </FetchedResourcesContext.Provider>
  );
}
