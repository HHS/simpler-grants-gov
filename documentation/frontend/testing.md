# Testing

## End to End (E2E) testing

E2E tests are run using Playwright. See [development.md](/DEVELOPMENT.md) for more general info!

### Spoofing logins

There are situations where we want to be able to test a "logged in" experience without having to script the test through the full login flow. In order to support this we have built a system to spoof the user login by placing a session cookie into the browser context. This system works by creating a client side cookie on the browser context within Playwright that will function the same as the session cookie. produced as the output of the real login process.

The system is defined in [Login Utils](https://github.com/HHS/simpler-grants-gov/blob/main/frontend/tests/e2e/loginUtils.ts)

#### Local setup

Local spoofed logins depend on an auth token for a test user that is generated each time the local database is seeded. During seed a file is created containing the key, which you can then reference in the Playwright process. Steps to implement:

- run `make db-seed-local` in the /api directory. This will create the necessary DB records for the spoofed user and spit out an API auth token in a file at /api/e2e_token.tmp.
- copy the token variable declaration from the e2e_token.tmp file into the `E2E_USER_AUTH_TOKEN` env var declaration in your frontend .env.local file
- that's it! Running e2e tests using spoofing should now work. [This process is encapsulated in our CI process here](https://github.com/HHS/simpler-grants-gov/blob/c5f29978c45d658329f2466d652da743d83d6a73/.github/workflows/ci-frontend-e2e.yml#L97).

#### Staging setup

Since staging tests run on a deployed server that does not expose a testing token directly, to spoof a login is a bit more involved, but only requires proper env vars to be set in order to work. A test user is set up in staging that can be spoofed. In order to obtain a session token for this user, Playwright needs to request it from a staging-only internal endpoint.

To run spoofed logins (locally or in CI), you will too have the SESSION_SECRET and STAGING_TEST_USER_API_KEY env vars are correctly set in .env.local. Values can be found 1password, or ask a team member.

### Test groups

In order to run a subset of e2e tests in different scenarios, supporting running smaller targeted test runs in PR environments for example, each test is assigned tags that mark them as members of testing groups. These testing groups are then referenced in test related jobs in Github actions to ensure that all functionality is tested at the right times, and that we are not testing less critical behavior more than is necessary.

There are two types of tags used in our grouping scheme - feature tags & execution tags. Execution tags determine the main cadence a test will run on, and feature tags can be used for more manually targeted test runs or for other identification purposes.

_All_ tests should be assigned exactly _one_ execution tag, and any number of feature tags.

Only defined test groups should be used, and the decision to create a new group should be made by only with approval from the testing and feature teams. [Current groups are defined here](https://github.com/HHS/simpler-grants-gov/blob/main/frontend/tests/e2e/tags.ts).

Current testing cadences are defined as:

| Test group       | Cadence                             | Environment(s) |
| ---------------- | ----------------------------------- | -------------- |
| @smoke           | All PRs                             | local          |
| @core-regression | Merge to main, Deploy to production | local, staging |
| @full-regression | Daily                               | local, staging |
| @extended        | Weekly                              | local, staging |

## Unit testing

- We use Jest and testing-library for our unit testing
- We strive for high unit test coverage (but not 100%)
- We expect engineers to write unit tests for any changes they make in the same PR that contains the code changes
- We use data fixtures when relevant (see https://github.com/HHS/simpler-grants-gov/blob/main/frontend/src/utils/testing/fixtures.ts)
- We strive to include axe tests on all components

See [development.md](/DEVELOPMENT.md) for more general info!

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
