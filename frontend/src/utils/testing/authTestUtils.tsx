import {
  AuthorizedData,
  FetchedResourceMap,
  ResourcePromiseDefinitions,
} from "src/types/authTypes";
import { UserPrivilegeDefinition } from "src/types/userTypes";

import {
  cloneElement,
  JSXElementConstructor,
  PropsWithChildren,
  ReactElement,
  ReactNode,
} from "react";
import { Alert } from "@trussworks/react-uswds";

import { UnauthenticatedMessage } from "src/components/user/UnauthenticatedMessage";

// copy pasta to keep imports simple
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



const registerMockImplementat


// Turns this into an HOF that
// - takes the main AuthGate props
// - returns a function that takes promise and privilege results to force
export const MockAuthorizationGate = jest.fn().mockImplementation(
  async ({
    children,
    onUnauthorized,
    onUnauthenticated = () => <UnauthenticatedMessage />,
    onError = (e: Error) => (
      <Alert heading={e.message} type="error" headingLevel="h2" />
    ),
    requiredPrivileges,
    resourcePromises,
  }: PropsWithChildren<AuthorizationGateProps>) => {
    if (!authenticated) {
      return onUnauthenticated();
    }
    const { authorizedData, unauthorized } = mockAuthorizeData({
      promiseResults,
      privilegeResults,
      requiredPrivileges,
      resourcePromises,
    });
    if (!unauthorized && onUnauthorized) {
      return onUnauthorized(children, authorizedData.fetchedResources);
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
  });



// interface MockAuthorizedData extends AuthorizedData {
//   unauthorized: boolean
// }

// const mockAuthorizeData = ({
//   promiseResults,
//   privilegeResults,
//   requiredPrivileges,
//   resourcePromises,
// }): MockAuthorizedData => {
//   const


// };

// export const createMockAuthorizationGate =
//   ({ authenticated = true, promiseResults, privilegeResults }) =>
//   async ({
//     children,
//     onUnauthorized,
//     onUnauthenticated = () => <UnauthenticatedMessage />,
//     onError = (e: Error) => (
//       <Alert heading={e.message} type="error" headingLevel="h2" />
//     ),
//     requiredPrivileges,
//     resourcePromises,
//   }: PropsWithChildren<AuthorizationGateProps>) => {
//     if (!authenticated) {
//       return onUnauthenticated();
//     }
//     const { authorizedData, unauthorized } = mockAuthorizeData({
//       promiseResults,
//       privilegeResults,
//       requiredPrivileges,
//       resourcePromises,
//     });
//     if (!unauthorized && onUnauthorized) {
//       return onUnauthorized(children, authorizedData.fetchedResources);
//     }
//     return children
//       ? cloneElement(
//           children as ReactElement<
//             { authorizedData?: object },
//             string | JSXElementConstructor<unknown>
//           >,
//           { authorizedData },
//         )
//       : children;
//   };
