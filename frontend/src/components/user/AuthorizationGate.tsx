"use server";

import { isEmpty } from "lodash";
import { parseErrorStatus } from "src/errors";
import { AuthorizedDataProvider } from "src/hooks/useAuthorizedData";
import { getSession } from "src/services/auth/session";
import { checkUserPrivilege } from "src/services/fetch/fetchers/userFetcher";
import {
  AuthorizedData,
  FetchedResource,
  FetchedResourceMap,
  ResourcePromiseDefinitions,
} from "src/types/authTypes";
import {
  UserPrivilegeDefinition,
  UserPrivilegeResult,
} from "src/types/userTypes";

import {
  cloneElement,
  JSXElementConstructor,
  PropsWithChildren,
  ReactElement,
  ReactNode,
} from "react";
import { Alert } from "@trussworks/react-uswds";

import { UnauthenticatedMessage } from "./UnauthenticatedMessage";

// requires either `requiredPrivileges` or `resourcePromises` because otherwise why are you using the gate?
type AuthorizationGateProps = {
  onUnauthorized?: (
    children: ReactNode,
    fetchedResources?: FetchedResourceMap,
  ) => ReactNode;
  onUnauthenticated?: () => ReactNode;
  onError?: (e: Error) => ReactNode;
} & (
  | {
      requiredPrivileges: UserPrivilegeDefinition[];
      resourcePromises?: ResourcePromiseDefinitions;
    }
  | {
      resourcePromises: ResourcePromiseDefinitions;
      requiredPrivileges?: UserPrivilegeDefinition[];
    }
  | {
      resourcePromises: ResourcePromiseDefinitions;
      requiredPrivileges: UserPrivilegeDefinition[];
    }
);

// unpack the fetched resource maps to get the first actual error
const findFirstError = (
  fetchedResources: FetchedResourceMap[],
): FetchedResource | undefined => {
  const firstError = fetchedResources.find((resource) =>
    Object.values(resource).some(
      (resourceDefinition) => resourceDefinition.statusCode !== 200,
    ),
  );
  return firstError ? Object.values(firstError)[0] : undefined;
};

// we need to expose status codes and possible errors as well as fetched data
// so that components can use this full context down stream.
// the promises generated here will be consumed in a Promise.all downstream.
// for this to work, will need to make sure any resource promises throw errors
// that include a status code in the cause...
const resolveAndFormatResources = (
  resourcePromises: ResourcePromiseDefinitions,
): Promise<FetchedResourceMap>[] => {
  const fetchResourcePromises = Object.entries(resourcePromises).map(
    ([resourceName, resourcePromise]) => {
      return resourcePromise
        .then((resourceData) => {
          return {
            [resourceName]: {
              data: resourceData,
              statusCode: 200,
            } as FetchedResource,
          };
        })
        .catch((e: Error) => {
          return {
            [resourceName]: {
              error: e.message,
              statusCode: parseErrorStatus(e),
            } as FetchedResource,
          };
        });
    },
  );
  return fetchResourcePromises;
};

// calls the API to check all required privileges,
// and formats results into a format to be used downstream
const checkRequiredPrivileges = async (
  token: string,
  userId: string,
  privileges: UserPrivilegeDefinition[],
): Promise<UserPrivilegeResult[]> => {
  const privilegeCheckResults = await Promise.all(
    privileges.map((privilege) => {
      return checkUserPrivilege(token, userId, privilege)
        .then(() => {
          return { ...privilege, authorized: true };
        })
        .catch((e: Error) => {
          if (parseErrorStatus(e) === 403) {
            return { ...privilege, authorized: false };
          }
          throw e;
        });
    }),
  );
  return privilegeCheckResults;
};

/*
  makes calls for required resources, if passed
  checks for required permissions, if passed
  optionally returns results of onUnauthorized function, if user is unauthorized based on calls to required resources
  passes results from required resource and required permission calls via both props and context
*/
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
  let userPrivileges: UserPrivilegeResult[] = [];
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
      // Note: we will handle errors based on the order that their respective promise was passed in. If multiple promises throw errors
      // any after the first error encountered will be swallowed, as we have not accounted for the ability to handle multiple errors.
      // We can improve this later
      const firstError = findFirstError(fetchedResources);
      if (firstError) {
        if (firstError.statusCode === 403 && onUnauthorized) {
          return onUnauthorized(children, allResources);
        }
        if (firstError.statusCode !== 403) {
          return onError(new Error(firstError.error));
        }
      }
    } catch (e) {
      return onError(e as Error);
    }
  }

  const authorizedData: AuthorizedData = {
    fetchedResources: allResources,
    confirmedPrivileges: userPrivileges,
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
          { authorizedData?: object },
          string | JSXElementConstructor<unknown>
        >,
        { authorizedData },
      )
    : children;

  // AuthorizedDataProvider allows any client component children of the gate to receive
  // fetched resources via context.
  return (
    <AuthorizedDataProvider value={authorizedData}>
      {childrenWithResources}
    </AuthorizedDataProvider>
  );
}
