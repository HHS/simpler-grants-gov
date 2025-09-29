"use server";

import { isEmpty } from "lodash";
import { FetchedResourcesProvider } from "src/hooks/useFetchedResources";
import { getSession } from "src/services/auth/session";
import { FrontendErrorDetails } from "src/types/apiResponseTypes";

import { PropsWithChildren, ReactNode } from "react";

import { UnauthenticatedMessage } from "./UnauthenticatedMessage";

type AuthorizationGateProps = {
  onUnauthorized: (children: ReactNode) => ReactNode;
  onUnauthenticated?: () => ReactNode;
  permissions?: string[];
  resourcePromises?: { [resourceName: string]: Promise<unknown> };
};

export async function AuthorizationGate({
  children,
  onUnauthorized,
  onUnauthenticated = () => <UnauthenticatedMessage />,
  // permissions,
  resourcePromises,
}: PropsWithChildren<AuthorizationGateProps>) {
  const session = await getSession();

  if (!session?.token) {
    return onUnauthenticated();
  }

  const mappedResourcePromises =
    resourcePromises && !isEmpty(resourcePromises)
      ? Object.entries(resourcePromises).map(
          ([resourceName, resourcePromise]) =>
            resourcePromise.then((resourceValue) => ({
              [resourceName]: resourceValue,
            })),
        )
      : undefined;

  if (mappedResourcePromises) {
    try {
      const fetchedResources = await Promise.all(mappedResourcePromises);
      const allResources = fetchedResources.reduce(
        (all, resource) => ({ ...all, ...resource }),
        {},
      );
      return (
        <FetchedResourcesProvider value={allResources}>
          {children}
        </FetchedResourcesProvider>
      );
    } catch (e) {
      const error = e as Error;
      if ((error.cause as FrontendErrorDetails).status === 403) {
        return onUnauthorized(children);
      }
    }
  }
  return children;
}
