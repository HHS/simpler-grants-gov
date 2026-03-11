# Testing

## E2E testing

### Spoofing logins

There are situations where we want to be able to test a "logged in" experience without having to script the test through the full login flow. In order to support this we have built a system to spoof the user login by placing a session cookie into the browser context.

This system is based on a `createSpoofedSessionCookie` which will create a client side cookie on the browser context that will effectively log in a fake user with the API.

Using this function, tests should work automatically in CI, but they will require a bit of manual setup to work locally.

#### Local setup

- run `make db-seed-local` in the /api directory. This will create the necessary DB records for the spoofed user and spit out an API auth token in a file at /api/e2e_token.tmp.
- copy the token variable declaration from the e2e_token.tmp file into your frontend .env.local file
- that's it! Running e2e tests using the functionality mentioned above should now work locally

## Unit testing

- We use Jest and testing-library for our unit testing
- We strive for high unit test coverage (but not 100%)
- We expect engineers to write unit tests for any changes they make in the same PR that contains the code changes
- We use data fixtures when relevant (see https://github.com/HHS/simpler-grants-gov/blob/main/frontend/src/utils/testing/fixtures.ts)
- We strive to include axe tests on all components

### Debugging

If you're using VSCode you have a couple of options for debugging tests using the built in debugger.

1. Setting a configuration in your launch.json

Create or edit a launch.json file in frontend/.vscode to include a configuration with this definition

```
    {
      "type": "node",
      "request": "launch",
      "name": "Jest debug current file",
      "program": "${workspaceRoot}/node_modules/jest/bin/jest.js",
      "args": [
        "--verbose",
        "-i",
        "--no-cache",
        "--testPathPattern",
        "${file}",
        "--testTimeout=100000000"
      ],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
```

With this in place you can navigate to the "Run and Debug" section on the left nav, and select "Jest debug current file" from the drop down. The debugger will honor any debuggers you have set while running tests in the file that you have open and active.

The caveat here is that this does not work for files that sit in directories or files with special characters in their names. The second option below does not have that problem.

2. Using the `Jest / Vitest Runner`

Install the `Jest / Vitest Runner` extension. When you open the quick menu with Command + P and type debug jest, you should see a task with that name. Running this does the same thing as option one, without the problem of special characters in the path.

### Helpful common patterns

Before writing tests, familiarize yourself with the [testing utilities](https://github.com/HHS/simpler-grants-gov/tree/main/frontend/src/utils/testing) that we have written to deal with common or complex testing scenarios

#### Async components

Testing async components requires some care, as Jest is not built to support it out of the box. It can be done though.

The easiest thing to do in these cases is to:

- rather than using JSX directly to render the component within the test, call the component as a function, passing the props as an argument
- render the returned value from the component function call
- [example usage](https://github.com/HHS/simpler-grants-gov/blob/f92baefc1b8409f12057240d98fa68d20946593b/frontend/tests/components/organization/manage-users/ActiveUsersSection.test.tsx#L44)

```
    const component = await ActiveUsersSection({
      organizationId: "org-123",
      activeUsers,
      roles,
    });
    render(component);

```

#### Route tests

Route tests will not work correctly unless we specify that Jest should use Node rather than JSdom with this at the top of the test file

```
/**
 * @jest-environment node
 */
```

#### Expected errors

A utility exists that can be used whenever you're expecting a route or component to throw an error.

- [wrapForExpectedError function](https://github.com/HHS/simpler-grants-gov/blob/f92baefc1b8409f12057240d98fa68d20946593b/frontend/src/utils/testing/commonTestUtils.ts#L30)
- [example usage](https://github.com/HHS/simpler-grants-gov/blob/f92baefc1b8409f12057240d98fa68d20946593b/frontend/tests/components/applyForm/widgets/WidgetRenderers.test.tsx#L49)
