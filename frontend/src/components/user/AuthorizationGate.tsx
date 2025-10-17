"use server";

import { isEmpty } from "lodash";
import { FetchedResourcesProvider } from "src/hooks/useFetchedResources";
import { getSession } from "src/services/auth/session";
import { getUserPrivileges } from "src/services/fetch/fetchers/userFetcher";
import { FrontendErrorDetails } from "src/types/apiResponseTypes";
import { UserPrivilegeDefinition } from "src/types/userTypes";
import { checkPrivileges } from "src/utils/authUtils";

import {
  cloneElement,
  JSXElementConstructor,
  PropsWithChildren,
  ReactElement,
  ReactNode,
} from "react";
import { Alert } from "@trussworks/react-uswds";

import { UnauthenticatedMessage } from "./UnauthenticatedMessage";

type AuthorizationGateProps = {
  onUnauthorized: (children: ReactNode) => ReactNode;
  onUnauthenticated?: () => ReactNode;
  onError?: (e: Error) => ReactNode;
  requiredPrivileges?: UserPrivilegeDefinition[];
  resourcePromises?: { [resourceName: string]: Promise<unknown> };
};

// will need to suspend any elements that are wrapped in this gate.
// note that this supports gating on a single privilege or multiple privileges, where auth will
// pass whenever any one of the required privileges is met (A OR B). This allows us to pass auth in the case
// where a user has permissions to access an organization's application through application privileges
// or organization privileges. In the future we can support (A AND B) situations (only pass auth if all
// permissions are found) by, perhaps, allowing nested arrays of privilege definitions, or by accepting
// a new "and/or" prop.
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
  if (requiredPrivileges) {
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
      // Allows for prop drilling of fetched resources into immediate child server components, as
      // usage of the client side context provider won't be available to server components.
      // Assumes any immediate children of the gate that want to accept fetchedResources via props
      // have an optional `fetchedResources` prop in place that can accept the added data here
      // Note: this does NOT work if the gate is used in a layout component - if you're going to prop
      // drill make sure you do it from a page component or further down the render chain
      const childrenWithResources = children
        ? cloneElement(
            children as ReactElement<
              { fetchedResources?: object },
              string | JSXElementConstructor<unknown>
            >,
            { fetchedResources: allResources },
          )
        : children;

      // FetchedResourcesProvider allows any client component children of the gate to receive
      // fetched resources via context.
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
