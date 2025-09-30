"use server";

import { isEmpty } from "lodash";
import { FetchedResourcesProvider } from "src/hooks/useFetchedResources";
import { getSession } from "src/services/auth/session";
import { getUserPrivileges } from "src/services/fetch/fetchers/userFetcher";
import { FrontendErrorDetails } from "src/types/apiResponseTypes";
import {
  UserPrivilegeDefinition,
  UserPrivilegesDefinition,
  UserPrivilegesResponse,
} from "src/types/userTypes";

import { cloneElement, PropsWithChildren, ReactNode } from "react";
import { Alert } from "@trussworks/react-uswds";

import { UnauthenticatedMessage } from "./UnauthenticatedMessage";

type AuthorizationGateProps = {
  onUnauthorized: (children: ReactNode) => ReactNode;
  onUnauthenticated?: () => ReactNode;
  onError?: (e: Error) => ReactNode;
  requiredPrivileges?: UserPrivilegeDefinition[];
  resourcePromises?: { [resourceName: string]: Promise<unknown> };
};

const checkPrivileges = (
  requiredPrivileges: UserPrivilegeDefinition[],
  userPrivileges: UserPrivilegesResponse,
): boolean => {
  const extractedUserPrivileges = extractPrivileges(userPrivileges);
  const privilegesSatisfied = requiredPrivileges.every((requiredPrivilege) => {
    return extractedUserPrivileges.some((userPrivilege) => {
      const hasBasePrivilege = userPrivilege.privileges.includes(
        requiredPrivilege.privilege,
      );
      return requiredPrivilege.resourceId
        ? requiredPrivilege.resourceId === userPrivilege.resourceId &&
            hasBasePrivilege
        : hasBasePrivilege;
    });
  });
  return privilegesSatisfied;
};

const extractPrivileges = (
  privilegesResponseData: UserPrivilegesResponse,
): UserPrivilegesDefinition[] => {
  const applicationPrivileges = privilegesResponseData.application_user_roles
    .length
    ? privilegesResponseData.application_user_roles.map(
        ({ application_id, application_user_roles }) => ({
          resourceId: application_id,
          privileges: application_user_roles.reduce((acc, { privileges }) => {
            return acc.concat(privileges);
          }, [] as string[]),
        }),
      )
    : [];

  const organizationPrivileges = privilegesResponseData.organization_user_roles
    .length
    ? privilegesResponseData.organization_user_roles.map(
        ({ organization_id, organization_user_roles }) => ({
          resourceId: organization_id,
          privileges: organization_user_roles.reduce((acc, { privileges }) => {
            return acc.concat(privileges);
          }, [] as string[]),
        }),
      )
    : [];

  return organizationPrivileges.concat(applicationPrivileges);
};

// will need to suspend any elements that are wrapped in this gate
export async function AuthorizationGate({
  children,
  onUnauthorized,
  onUnauthenticated = () => <UnauthenticatedMessage />,
  onError = (e: Error) => (
    <Alert heading={e.message} type="error" headingLevel="h2" />
  ),
  requiredPrivileges,
  resourcePromises,
}: PropsWithChildren<AuthorizationGateProps>) {
  const session = await getSession();

  if (!session?.token) {
    return onUnauthenticated();
  }

  // check privileges
  if (requiredPrivileges && requiredPrivileges.length) {
    const userPrivileges = await getUserPrivileges(
      session.token,
      session.user_id,
    );
    const privilegesSatisfied = checkPrivileges(
      requiredPrivileges,
      userPrivileges,
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

  // fetch resources and check for 403s
  if (mappedResourcePromises) {
    try {
      // Note: there's a potential performance gain here if we make these fetches in parallel with the user privileges call
      const fetchedResources = await Promise.all(mappedResourcePromises);
      const allResources = fetchedResources.reduce(
        (all, resource) => ({ ...all, ...resource }),
        {},
      );
      // assumes any immediate children of the gate that want to accept fetchedResources via props
      // have an optional `fetchedResources` prop in place that can accept the added data here
      const childrenWithResources = children
        ? cloneElement(children, { fetchedResources: allResources })
        : children;
      return (
        <FetchedResourcesProvider value={allResources}>
          {childrenWithResources}
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

  // on authorized, render children
  return children;
}
