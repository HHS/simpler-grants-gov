# Testing

## End to End (E2E) testing

E2E tests are run using Playwright. See [development.md](/DEVELOPMENT.md) for more general info!

### Running against deployed environments

Playwright tests can be directed at any deployed environment by adjusting environment variables set in your `.env.local` file. For example, when running against staging:

```
PLAYWRIGHT_TARGET_ENV=staging
PLAYWRIGHT_BASE_URL=https://staging.simpler.grants.gov
PLAYWRIGHT_API_URL=https://api.staging.simpler.grants.gov
TEST_USER_EMAIL=<from 1password>
TEST_USER_PASSWORD=<from 1password>
TEST_USER_MFA_KEY=<from 1password>
SESSION_SECRET=<from 1password>
TEST_USER_MANAGER_API_KEY=<from 1password>
```

Note that tests will still run without having secret env vars set, but tests involving login will fail.

The correct values for secrets can be found in 1Password, AWS SSM, or ask a team member.

### Spoofing logins

There are situations where we want to be able to test a "logged in" experience without having to script the test through the full login flow. In order to support this we have built a system to spoof the user login by placing a session cookie into the browser context. This system works by creating a client side cookie on the browser context within Playwright that will function the same as the session cookie produced as the output of the real login process.

Both local and staging use the same mechanism: Playwright fetches a session token for a seeded test user from the staging-only internal endpoint `POST /v1/internal/e2e-token`, then encodes it into a spoofed client session cookie. The request is authorized by a "test user manager" API key, and the target test user is chosen per test via a readable key (see [test-users.ts](https://github.com/HHS/simpler-grants-gov/blob/main/frontend/tests/e2e/utils/auth/test-users.ts)). Seeded test users have no login credentials, so if spoofing fails the test fails — there is no fallback to a real Login.gov login.

The system is defined in [Login Utils](https://github.com/HHS/simpler-grants-gov/blob/main/frontend/tests/e2e/utils/auth/login-utils.ts) and [Authenticate E2E User Utils](https://github.com/HHS/simpler-grants-gov/blob/main/frontend/tests/e2e/utils/auth/authenticate-e2e-user-utils.ts).

#### Local setup

- run `make db-seed-local` in the /api directory. This creates the seeded test users (flagged so their tokens can be fetched via the e2e-token endpoint) and the test-user-manager account.
- set `SESSION_SECRET` and `TEST_USER_MANAGER_API_KEY` in your frontend `.env.local`. `TEST_USER_MANAGER_API_KEY` must match `LOCAL_TEST_USER_MANAGER_API_KEY` in `api/local.env` (default: `local-manager-key`).
- that's it! Running e2e tests using spoofing should now work.

#### Switching between local and deployed environments

Whether running against a local or deployed environment, Playwright reads the **same** env var, `TEST_USER_MANAGER_API_KEY` — only its value differs (the local `make db-seed-local` default `local-manager-key` vs. the key for the deployed environment). So to switch targets on your machine, change `PLAYWRIGHT_TARGET_ENV` and swap the `TEST_USER_MANAGER_API_KEY` (and `SESSION_SECRET`) value to match. In CI this is handled automatically: the local workflow passes `local-manager-key` and the deployed workflow injects the key for the deployed environment, both into `TEST_USER_MANAGER_API_KEY`.

### Test groups

In order to run a subset of e2e tests in different scenarios, supporting running smaller targeted test runs in PR environments for example, each test is assigned tags that mark them as members of testing groups. These testing groups are then referenced in test related jobs in Github actions to ensure that all functionality is tested at the right times, and that we are not testing less critical behavior more than is necessary.

There are two types of tags used in our grouping scheme - feature tags & execution tags. Execution tags determine the main cadence a test will run on, and feature tags can be used for more manually targeted test runs or for other identification purposes.

_All_ tests should be assigned exactly _one_ execution tag, and any number of feature tags.

Only defined test groups should be used, and the decision to create a new group should be made by only with approval from the testing and feature teams. [Current groups are defined here](https://github.com/HHS/simpler-grants-gov/blob/main/frontend/tests/e2e/tags.ts).

Test assignments for any given test should be determined by the team creating or managing the test.

Current testing cadences are defined as:

| Test group       | Cadence                             | Environment(s) |
| ---------------- | ----------------------------------- | -------------- |
| @smoke           | All PRs                             | local          |
| @core-regression | Merge to main, Deploy to production | local, staging |
| @full-regression | Daily                               | local, staging |
| @extended        | Weekly                              | local, staging |

#### Conditional test cadences

The table above shows the default test cadences for each group. Teams may expand the list of tag groups run on each cadence depending on any criteria they choose. Most likely, teams will want to define the test groups based on which files have been changed in a PR. For examples of conditional cadences introduced in our system:

| Test group              | Cadence                                                  | Environment(s) |
| ----------------------- | -------------------------------------------------------- | -------------- |
| @apply-forms            | All PRs including changes to apply form code             | local          |
| @opportunity-management | All PRs including changes to opportunity management code | local          |

#### Browser test cadences

Locally targeted runs have 4 browser configurations available (Chromium, Mobile Chromium, Webkit, Firefox). Deployed targets only have the two chromium ones, because staging MFA login is rate limited outside of Chrome. Which of the available browsers a given run actually uses depends on the cadence:

| Cadence        | Browsers                                   |
| -------------- | ------------------------------------------ |
| All PRs        | Chromium only                              |
| Merge to main  | All 4 (local), Chromium + Mobile (staging) |
| Daily / weekly | All 4 (local), Chromium + Mobile (staging) |

PRs are limited to Chromium so that the smoke suite stays fast — running the same specs across all 4 configurations quadruples the test count for a signal that cross-browser breakage rarely shows up in. Cross-browser coverage still runs on every merge to main and on the daily and weekly schedules, so a Firefox- or Webkit-only regression is caught before release rather than on the PR that introduced it.

A run's browser set is selected with the `playwright_projects` input on the [e2e composite action](https://github.com/HHS/simpler-grants-gov/blob/main/.github/actions/e2e/action.yml), which becomes the `PLAYWRIGHT_PROJECTS` env var that `playwright.config.ts` filters projects on. Leave it blank to run every project defined for the target. When narrowing to a non-Chrome browser, make sure the matching `do-*-install` input is also set, or the run will fail trying to launch a browser that was never installed.

In some cases an individual test may be skipped in one or more browsers. This may be because the browser's implementation of certain behavior makes it very difficult to test (see Webkit's implementation of pasteboards), or because of a need to limit traffic for a certain action (see running login tests only in Chrome). The posture towards browser based testing can be flexible.

#### How CI parallelizes runs

Both e2e workflows split the suite across a matrix of shards, one runner each, and merge the blob reports afterwards. The two workflows get their concurrency from different places:

- **[ci-frontend-e2e.yml](https://github.com/HHS/simpler-grants-gov/blob/main/.github/workflows/ci-frontend-e2e.yml)** (local target) uses 4 shards and stands up its own API and frontend per shard, so each shard is isolated and runs with the default 10 workers.
- **[e2e-staging.yml](https://github.com/HHS/simpler-grants-gov/blob/main/.github/workflows/e2e-staging.yml)** (deployed target) points every shard at one shared environment, so it pins `workers: 1`. Every test on a deployed target authenticates as one of a handful of static shared test users, so adding concurrency by sharding across runners — where Playwright keeps same-file tests together — is safer than in-process parallelism. If you see cross-test interference on a deployed run, suspect two shards mutating the same test user's state before you suspect a real regression.

Raising the shard count means editing both `shard` and `total_shards` in the workflow's matrix; they must agree, since they become Playwright's `--shard=current/total`.

##### Why the deployed target shards each project separately

Playwright balances shards by collected test count, which is a poor proxy for duration in this suite — the `apply/` flows take 60–90s each while most other tests take a few seconds. Two consequences shape the deployed matrix:

1. On a deployed target, most spec files skip everything but Chrome. Those Mobile chrome tests are still collected, so a matrix shared between both projects hands entire runners work that skips in seconds while the Chrome shards carry the whole suite.
2. `testDir` is walked alphabetically, so `apply/` always sorts first and its slow flows always land on the lowest-numbered shards.

Because Playwright names its blob report after the shard number alone, two projects both running "shard 1" would each write `report-1.zip` and clobber each other when the report job merges them into one directory. The `shard_label` input on the e2e composite action gives each matrix entry a unique name for both the blob file and the artifact; it defaults to the shard number, so single-project runs need not set it.

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

```jsonc
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

```tsx
const component = await ActiveUsersSection({
  organizationId: "org-123",
  activeUsers,
  roles,
});
render(component);
```

#### Route tests

Route tests will not work correctly unless we specify that Jest should use Node rather than JSdom with this at the top of the test file

```js
/**
 * @jest-environment node
 */
```

#### Expected errors

A utility exists that can be used whenever you're expecting a route or component to throw an error.

- [wrapForExpectedError function](https://github.com/HHS/simpler-grants-gov/blob/f92baefc1b8409f12057240d98fa68d20946593b/frontend/src/utils/testing/commonTestUtils.ts#L30)
- [example usage](https://github.com/HHS/simpler-grants-gov/blob/f92baefc1b8409f12057240d98fa68d20946593b/frontend/tests/components/applyForm/widgets/WidgetRenderers.test.tsx#L49)
