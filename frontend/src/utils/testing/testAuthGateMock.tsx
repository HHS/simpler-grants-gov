import { render, screen } from "@testing-library/react";

import { AuthGateTester } from "./AuthGateTester";

let MockAuthorizationGate = jest.fn();

/*

  todos:

  - typing
  - we don't need to match up the passed in promises and requested privileges, we can send in mock expectations and skip that
  - does this work? test out some scenarios

*/

const mockAuthorizeData = ({
  promiseResults,
  privilegeResults,
}: {
  promiseResults;
  privilegeResults;
}) => {
  let unauthorized = false;
  if (
    promiseResults.any((result) => {
      result.statusCode === 403;
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

*/
const mockAuthorizationGateFor = ({
  authenticated = true,
  promiseResults,
  privilegeResults,
}) => {
  return async ({
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
  };
};

jest.mock("src/components/user/AuthorizationGate", () => ({
  AuthorizationGate: (props: unknown) => MockAuthorizationGate(props),
}));

describe("test the mock", () => {
  it("does it", async () => {
    MockAuthorizationGate.mockImplementation(
      mockAuthorizationGateFor({
        authenticated: true,
        promiseResults: {},
        privilegeResults: [],
      }),
    );
    render(<AuthGateTester />);
    expect(screen.getByText("")).toBeInTheDocument();
  });
});
