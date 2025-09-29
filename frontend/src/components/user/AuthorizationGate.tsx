import { isEmpty } from "lodash";
import { getSession } from "src/services/auth/session";

import { PropsWithChildren, ReactNode } from "react";

import { UnauthenticatedMessage } from "./UnauthenticatedMessage";

type AuthorizationGateProps = {
  onUnauthorized: () => ReactNode;
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
      console.log("!!! fetched resources", fetchedResources);
    } catch (e) {
      const error = e as Error;
      if (error.cause.status === 403) {
        return onUnauthorized(children);
      }
    }
  }
  return children;
}
