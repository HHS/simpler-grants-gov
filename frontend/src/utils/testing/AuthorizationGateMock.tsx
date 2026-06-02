import {
  AuthorizationGateProps,
  FetchedResourceMap,
} from "src/types/authTypes";
import { UserPrivilegeResult } from "src/types/userTypes";

import {
  cloneElement,
  JSXElementConstructor,
  PropsWithChildren,
  ReactElement,
} from "react";

export const mockOnUnauthenticated = jest.fn();

// pass through the provided promise and privilege results, but
// set unauthorized if the promises represent an unauthorized request
const mockAuthorizeData = ({
  promiseResults,
  privilegeResults,
}: {
  promiseResults: FetchedResourceMap;
  privilegeResults: UserPrivilegeResult[];
}) => {
  let unauthorized = false;
  if (
    Object.values(promiseResults).some((result) => {
      return result.statusCode === 403;
    })
  ) {
    unauthorized = true;
  }
  return {
    unauthorized,
    authorizedData: {
      fetchedResources: promiseResults,
      confirmedPrivileges: privilegeResults,
    },
  };
};

/*

what does this do

- returns result of onUnauthorized handler when expected
- returns result of onUnauthenticated handler when expected
- passes expected result of resourcePromises to children
- passes expected result of requiredPrivilege calls to children

needs to know about original props
needs to know about expectated behavior

the goal here is to create something that simulates what the gate does without making any of the API calls, while returning
predictable data into child components

*/
export const mockAuthorizationGateFor = ({
  authenticated = true,
  promiseResults,
  privilegeResults,
}: {
  authenticated?: boolean;
  promiseResults: FetchedResourceMap;
  privilegeResults: UserPrivilegeResult[];
}) => {
  return ({
    children,
    onUnauthorized, // to test this, you'll need to mock in each individual file. See the auth gate mock test for an example
    onUnauthenticated = mockOnUnauthenticated,
    resourcePromises,
  }: PropsWithChildren<AuthorizationGateProps>) => {
    // need to make sure that this won't actually run the promises, but will prevent
    // a stack overflow in the case that a promise.reject makes it through
    if (resourcePromises) {
      Object.values(resourcePromises).forEach((promise) =>
        promise.catch(() => {}),
      );
    }
    if (!authenticated) {
      return onUnauthenticated();
    }
    const { authorizedData, unauthorized } = mockAuthorizeData({
      promiseResults,
      privilegeResults,
    });
    if (unauthorized && onUnauthorized) {
      return onUnauthorized(children, authorizedData?.fetchedResources);
    }

    return children
      ? cloneElement(
          children as ReactElement<
            { authorizedData?: object },
            string | JSXElementConstructor<unknown>
          >,
          { authorizedData },
        )
      : children;
  };
};
