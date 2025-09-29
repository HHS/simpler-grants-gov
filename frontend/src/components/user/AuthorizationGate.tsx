"use server";

import { isEmpty } from "lodash";
import { FetchedResourcesProvider } from "src/hooks/useFetchedResources";
import { getSession } from "src/services/auth/session";
import { getUserPrivileges } from "src/services/fetch/fetchers/userFetcher";
import { FrontendErrorDetails } from "src/types/apiResponseTypes";
import {
  UserPrivilegeDefinition,
  UserPrivilegesResponse,
} from "src/types/UserTypes";

import { PropsWithChildren, ReactNode } from "react";
import { Alert } from "@trussworks/react-uswds";

import { UnauthenticatedMessage } from "./UnauthenticatedMessage";

type AuthorizationGateProps = {
  onUnauthorized: (children: ReactNode) => ReactNode;
  onUnauthenticated?: () => ReactNode;
  onError?: (e: Error) => ReactNode;
  requiredPriviliges?: UserPrivilegeDefinition[];
  resourcePromises?: { [resourceName: string]: Promise<unknown> };
};

const extractPrivileges = (
  privilegesResponseData: UserPrivilegesResponse,
) => {};

// will need to suspend any elements that are wrapped in this gate
export async function AuthorizationGate({
  children,
  onUnauthorized,
  onUnauthenticated = () => <UnauthenticatedMessage />,
  onError = (e: Error) => (
    <Alert heading={e.message} type="error" headingLevel="h2" />
  ),
  requiredPriviliges,
  resourcePromises,
}: PropsWithChildren<AuthorizationGateProps>) {
  const session = await getSession();

  if (!session?.token) {
    return onUnauthenticated();
  }

  if (requiredPriviliges && requiredPriviliges.length) {
    const userPrivileges = await getUserPrivileges(
      session.token,
      session.user_id,
    );
    const extractedPrivileges = extractPrivileges(userPrivileges);
    const privilegesSatisfied = requiredPriviliges.every(
      (requiredPrivilege) => {
        return extractedPrivileges.some((userPrivilege) => {
          const hasBasePrivilege =
            userPrivilege.privilege === requiredPrivilege.privilege;
          return requiredPrivilege.resourceId
            ? requiredPrivilege.resourceId === userPrivilege.resourceId &&
                hasBasePrivilege
            : hasBasePrivilege;
        });
      },
    );
    if (!privilegesSatisfied) {
      return onUnauthorized(children);
    }
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
      return onError(error);
    }
  }
  return children;
}
