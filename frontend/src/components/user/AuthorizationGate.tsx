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

type FetchedResource = {
  data?: object;
  statusCode: number;
  error?: string;
};

type AuthorizedData = {
  fetchedResources: { [key: string]: FetchedResource };
  requiredPermissions: {
    [key: string]: boolean;
  };
};

const resolveAndFormatResources = (
  resourcePromises: Promise<unknown>[],
): Promise<FetchedResource>[] => {
  return resourcePromises
    .map((resourcePromise) => {
      return resourcePromise.then((resourceData) => {
        return {
          data: resourceData,
          statusCode: 200,
        };
      });
    })
    .catch((e) => {
      return {
        error: e,
        statusCode: e.status,
      };
    });
};

const checkRequiredPrivileges = () => {};

// requires either `requiredPrivileges` or `resourcePromises` because otherwise why are you using the gate?
type AuthorizationGateProps = {
  onUnauthorized?: (children: ReactNode) => ReactNode;
  onUnauthenticated?: () => ReactNode;
  onError?: (e: Error) => ReactNode;
} & (
  | {
      requiredPrivileges: UserPrivilegeDefinition[];
      resourcePromises?: { [resourceName: string]: Promise<unknown> };
    }
  | {
      resourcePromises: { [resourceName: string]: Promise<unknown> };
      requiredPrivileges?: UserPrivilegeDefinition[];
    }
  | {
      resourcePromises: { [resourceName: string]: Promise<unknown> };
      requiredPrivileges: UserPrivilegeDefinition[];
    }
);

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
  let userPrivileges = [];
  let allResources = {};

  const session = await getSession();

  if (!session?.token) {
    return onUnauthenticated();
  }

  // check privileges
  if (requiredPrivileges) {
    userPrivileges = await checkRequiredPrivileges(
      session.token,
      session.user_id,
      requiredPrivileges,
    );
  }

  const mappedResourcePromises =
    resourcePromises && !isEmpty(resourcePromises)
      ? resolveAndFormatResources(resourcePromises)
      : undefined;

  // fetch resources and check for 403s
  if (mappedResourcePromises) {
    try {
      // Note: there's a potential performance gain here if we make these fetches in parallel with the user privileges calls
      const fetchedResources = await Promise.all(mappedResourcePromises);
      allResources = fetchedResources.reduce(
        (all, resource) => ({ ...all, ...resource }),
        {},
      );
    } catch (e) {
      const error = e as Error;
      if (
        (error.cause as FrontendErrorDetails).status === 403 &&
        onUnauthorized
      ) {
        return onUnauthorized(children);
      }
      return onError(error);
    }

    const authorizedData = {
      fetchedResources: allResources,
      requiredPermissions: userPrivileges,
    };

    // Allows for prop drilling of fetched resources into immediate child server components, as
    // usage of the client side context provider won't be available to server components.
    // Assumes any immediate children of the gate that want to accept fetchedResources via props
    // have an optional `fetchedResources` prop in place that can accept the added data here
    // Note: this does NOT work if the gate is used in a layout component - if you're going to prop
    // drill make sure you do it from a page component or further down the render chain
    const childrenWithResources = children
      ? cloneElement(
          children as ReactElement<
            { authorziedData?: AuthorizedData },
            string | JSXElementConstructor<unknown>
          >,
          { authorizedData },
        )
      : children;

    // FetchedResourcesProvider allows any client component children of the gate to receive
    // fetched resources via context.
    return (
      <FetchedResourcesProvider value={authorizedData}>
        {childrenWithResources}
      </FetchedResourcesProvider>
    );
  }
  // on authorized, render children
  return children;
}
