# Frontend Authorization

Managing user authorization on the Simpler frontend app is handled largely through the use of the `AuthorizationGate` component.

## What the AuthorizationGate does

The <AuthorizationGate> component is designed to wrap a page, and can provide:

- page level gating
  - if a user shouldn't have access to a page based on their permissions, the gate can prevent them from seeing any page content
  - note that authentication based gating is built in as well. Any user that is not logged in with a valid session token will be prevented from seeing any page content
- checks for access to any authorization gated data required by a page
  - the gate will make calls for any authorized data that the page will need, and can
- checks for any specific permissions required by the page
  - the gate will make calls to check for any number of user permissions that are relevant to loading or displaying the page

### General usage

AuthorizationGate is wrapper around a page content child, and depending on how the gate is configured, either supplies the page content component with authorization related data as a prop, or renders the result of a callback function.

Note that the gate cannot be implemented in a Layout, due to the way that it handles passing props to children. Since the child of a layout is a page component, and pages have strictly defined props, AuthorizationGates must be implemented within Page components. It is best practice, on pages using the AuthorizationGate, to create a single page content component to serve as teh child of the AuthorizationGate.

The AuthorizationGate is a server component.

To see the gate in action, take a look at the [manage users page](<https://github.com/HHS/simpler-grants-gov/blob/736ee5d971f177a9cdbd60dc87fe5bf509c93e2d/frontend/src/app/%5Blocale%5D/(base)/workspace/organizations/%5Bid%5D/manage-users/page.tsx#L35>);

### Gating

In general, the component will render the result of `onUnauthenticated` or `onUnauthorized` callbacks if they are supplied and the user is deemed to be unauthenticated or unauthorized.

- onUnauthenticated: this callback will run whenever a user does not have a session token / is not logged in. If the callback is not provided, the default behavior is to render an `UnauthenticatedMessage` component instead of the page
- onUnauthorized: this callback will run if any calls for authorized resources result in unauthorized response codes (403). If not provided, no gating will be done on unauthorized errors, but unauthorized response results will be passed as a prop to children so that the page can respond however makes sense.
  - note that onUnauthorized will be called with `children` and the results all resource calls as arguments

### Resource fetch checks

AuthorizationGate can take an array of promises that represent API calls for authorization gated resources that the page will use in one way or another. The gate will resolve the promise, and:

- if successful or resolved with a non 403 error
  - pass the result via props to the gate's child component
- if unauthorized, resolved with a 403 either
  - pass the result via props to the gate's child component
  - gate access to the page by returning

For example, a "manage users" page will need to fetch a list of active users, and a list of invited users from the API, but this data will only be available to users with proper privileges. A promise for these API calls can be passed to the AuthorizationGate.

```
const usersPromise = fetchUsers(..)

render (
	<AuthorizationGate resourcePromises={
		{
			users: usersPromise
		}
	}>
		{children}
	</>
)

```

If any call succeeds, the page will have the user list data available via props.

```
{
	...props,
	authorizedData: {
		fetchedResources: {
			users: {
				data: { ...fetchedUserData },
				status: 200
			}
		}
	}
}
```

If any call results in a 403, this info will be passed to the page, or, if an onUnauthorized callback is provided to the gate, the result of that callback will be rendered instead of the page.

```
{
	...props,
	authorizedData: {
		fetchedResources: {
			users: {
				error: E,
				status: 403
			}
		}
	}
}
```

If any call errors with a non-403, the error will be passed to the page via props.

Unless a call fails and an onUnauthorized callback is provided, the child page will render as normal.

### Permission checks

AuthorizationGate can take an array of privileges that are relevant to the functioning of the page. The gate will make calls to check whether or not the user has each of the given privileges and will make the results of the calls available via props.

Permission definitions that will be passed to the gate look like this (refer to the `UserPrivilegeDefinition` type in code for detail on available resourceType and privileges values):

```
{
  resourceId?: string;
  resourceType: "application" | "organization" | "agency" ...;
  privilege: "manage_org_members"  | "manage_org_admin_members" | "view_org_membership" ...
}
```

For example, an "organization users" page may have a button with a link to a "manage users" page that should only be available to users with the "manage users" privilege for the organization. In this case the page can pass a resource definition such as the following to the gate.

```
{
  resourceId: "ORGANIZATIONID1",
  resourceType: "organization",
  privilege: "manage_org_members"
}
```

The child component of the gate would then receive the following props, assuming the user had the specified privilege.

```
{
	...props,
	authorizedData: {
		confirmedPrivileges: [{
		  resourceId: "ORGANIZATIONID1",
		  resourceType: "organization",
		  privilege: "manage_org_members",
		  authorized: true
		}]
	}
}
```

## Testing with the AuthorizationGate

Since the ins and outs of the AuthorizationGate are a bit difficult to test, a handy helper function is available to help test pages using the AuthorizationGate.

In general, you'll use the `mockAuthorizationGateFor` function to provide a set of expected resource promise and confirmed privilege results that will be passed to the child component. You can then assert that the child component is rendered with these props.

Additionally, you can make sure that the instance of the AuthorizationGate you're testing properly handles unauthorized calls for resources by passing in an expected resource response with a 403 status code.

Testing this way abstracts away the internal network calls made by the AuthorizationGate, including the resolution of resource promises and thus removes the need to mock out the specifics of your resource promises and privilege calls. You will still need to mock out any `onUnauthorized` behavior that your implmentation of the gate will be using.

Since this testing strategy requires mocking out the gate's children, testing page components that use the AuthorizationGate won't be a good way to test out the actual UI. Any tests for the page's UI should be done one level down, on the gate's child components.

### Checklist

To properly test a page using the AuthorizationGate you will need to:

- mock out API call functionality (necessary to avoid including session management or other complex server side dependencies in the test)
- mock out the gate component
- mock out child content component
- in each test, call `mockAuthorizationGateFor` to specify what data the child component should expect to receive from the gate
- assert that the mock API call functions are called with the expected arguments
- assert that the mock child components are called with expected props, as dictated by the arguments passed to `mockAuthorizationGateFor`

### Examples

Simple success case:

```
// mock out API calls

const getOrganizationPendingInvitationsMock = jest.fn().mockResolvedValue({});
jest.mock("src/services/fetch/fetchers/organizationsFetcher", () => ({
  getOrganizationPendingInvitations: (...args: unknown[]) =>
    getOrganizationPendingInvitationsMock(...args) as unknown,
}));


// mock out the gate

const MockAuthorizationGate = jest.fn();
jest.mock("src/components/user/AuthorizationGate", () => ({
  AuthorizationGate: (props: unknown) => {
    return MockAuthorizationGate(props) as unknown;
  },
}));

// mock out child component

const ManageUsersPageContentMock = jest.fn();
jest.mock("src/components/manageUsers/ManageUsersPageContent", () => ({
  ManageUsersPageContent: (props: unknown) =>
    ManageUsersPageContentMock(props) as unknown,
}));

...

// specify expected data to pass from gate

it(..., () => {
	const gateMock = mockAuthorizationGateFor({
      promiseResults: {
        invitedUsersList: {
          statusCode: 200,
          data: {
            someData: "here",
          },
        },
      },
      privilegeResults: [
        {
          resourceId: "1",
          resourceType: "organization",
          privilege: "manage_org_members",
          authorized: true,
        },
      ],
   });
	MockAuthorizationGate.mockImplementation(gateMock);
	render(PageWithGate)

	// assert that the mock API call functions are called with the expected arguments

    expect(getOrganizationPendingInvitationsMock).toHaveBeenCalledWith(param);

	// assert that the mock child components are called with expected props

	expect(ManageUsersPageContentMock).toHaveBeenCalledWith({
      organizationId: "org-123",
      authorizedData: {
        fetchedResources: {
          invitedUsersList: {
            statusCode: 200,
            data: {
              someData: "here",
            },
          },
        },
        confirmedPrivileges: [
          {
            resourceId: "1",
            resourceType: "organization",
            privilege: "manage_org_members",
            authorized: true,
          },
        ],
      },
    }));
})


```

With custom `onUnauthorized` behavior:

```
// mock out API calls

// mock out the gate

// mock out child component

// mock UnauthorizedMessage

const MockUnauthorizedMessage = jest.fn(() => <span>unauthorized</span>);

jest.mock("src/components/user/UnauthorizedMessage", () => ({
  UnauthorizedMessage: () => {
    return MockUnauthorizedMessage() as unknown;
  },
}));

...

// specify expected data to pass from gate

it(..., () => {
	const gateMock = mockAuthorizationGateFor({
      promiseResults: {
        invitedUsersList: {
          statusCode: 403, // send a 403 back to trigger unauthorized behavior
          data: {
            someData: "here",
          },
        },
      },
      privilegeResults: [
        {
          resourceId: "1",
          resourceType: "organization",
          privilege: "manage_org_members",
          authorized: true,
        },
      ],
   });
	MockAuthorizationGate.mockImplementation(gateMock);
	render(PageWithGate)

	// assert that `onUnauthorized` mock function was called correctly

	expect(MockUnauthorizedMessage).toHaveBeenCalledTimes(1);
})
```

# Notes

The AuthorizationGate was originally built with two ways of consuming authorized resource data and privileges - one being the passing of resources and privilege confirmations to the child component of the gate, and the other being the use of a provider to make the data available to deeply nested client child components.

It was determined that the provider added additional complexity that was not necessary, as the necessary data can always be made available to deeply nested children via prop drilling if that's required.
