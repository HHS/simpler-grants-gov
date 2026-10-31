# Testing

## End to End (E2E) testing

E2E tests use Playwright. Specs live in [`frontend/tests/e2e`](../../frontend/tests/e2e) and end in `.spec.ts`; many have corresponding `.feature` files describing their scenarios. Playwright runs the TypeScript specs, not the feature files. Configuration is in [`tests/playwright.config.ts`](../../frontend/tests/playwright.config.ts), with environment handling in [`tests/e2e/playwright-env.ts`](../../frontend/tests/e2e/playwright-env.ts).

Run the npm and Playwright commands below from `frontend/`, after installing the Node version in [`.nvmrc`](../../frontend/.nvmrc) and dependencies with `npm ci`. General setup is covered in [frontend development](./development.md) and [DEVELOPMENT.md](../../DEVELOPMENT.md).

### Running against deployed environments

Supported targets are `local` (the default), `staging`, `grantor1`, and `grantor2`. Playwright loads `frontend/.env.local`; variables already exported in your shell take precedence. Nonlocal targets require both URLs. For example, use these settings for staging:

```dotenv
PLAYWRIGHT_TARGET_ENV=staging
PLAYWRIGHT_BASE_URL=https://staging.simpler.grants.gov
PLAYWRIGHT_API_URL=https://api.staging.simpler.grants.gov
SESSION_SECRET=<session secret for the target frontend>
TEST_USER_MANAGER_API_KEY=<test-user-manager key for the target API>
STAGING_TEST_USER_EMAIL=<Login.gov test account email>
STAGING_TEST_USER_PASSWORD=<Login.gov test account password>
STAGING_TEST_USER_MFA_KEY=<Login.gov test account MFA key>
```

Obtain deployed secrets from 1Password, AWS SSM, or a team member. Keep them in local configuration, never in committed files. `SESSION_SECRET_OVERRIDE`, when set, takes precedence over `SESSION_SECRET` for Playwright; CI uses the override when testing deployed environments.

The `STAGING_TEST_USER_*` variables are used by the real Login.gov test, not session spoofing. The Login.gov helper checks these credentials when imported, so collecting the full suite against a deployed target requires them even before tests run. A focused spec that only uses spoofed authentication instead needs the session secret and manager API key. The Login.gov spec is skipped for the local target.

Install Chromium and run, for example:

```sh
npx playwright install --with-deps chromium
PLAYWRIGHT_WORKERS=1 npm run test:e2e -- --project=Chrome --grep '@smoke'
```

Deployed runs do not start a local frontend or API. The [E2E composite action](../../.github/actions/e2e/action.yml) contains the URL mapping for `staging`, `grantor1`, and `grantor2`. These targets have prepared test users and data; `dev` and `prod` are not supported target names.

### Spoofing logins

[`authenticateE2eUser`](../../frontend/tests/e2e/utils/auth/authenticate-e2e-user-utils.ts) authenticates a seeded test user by requesting a server token from `POST /v1/internal/e2e-token`, then wrapping it in a signed client session cookie via [login-utils.ts](../../frontend/tests/e2e/utils/auth/login-utils.ts). The API endpoint is restricted to lower environments and requires the test-user-manager API key. The session secret must match the target frontend's secret.

Tests select an identity using a readable key from [`test-users.ts`](../../frontend/tests/e2e/utils/auth/test-users.ts). Spoofing is the only authentication path for these seeded users: failure fails the test rather than falling back to Login.gov. The separate [`login-with-login-gov.spec.ts`](../../frontend/tests/e2e/login/specs/login-with-login-gov.spec.ts) exercises the real login flow.

#### Local setup

1. Follow [API development setup](../api/development.md). From `api/`, initialize the services, seed the database and search indexes, and start the API:

   ```sh
   make init
   make setup-api-data
   make start
   ```

   `setup-api-data` includes `db-seed-local`, which creates the E2E test users and test-user-manager account. If the API is already initialized, seeded, and running, these steps do not need repeating.

2. Create or update `frontend/.env.local` using [`.env.local.example`](../../frontend/.env.local.example). Copy `API_JWT_PUBLIC_KEY` from `api/override.env` as described in [local authentication setup](./development.md#authentication). Ensure these E2E values are set:

   ```dotenv
   PLAYWRIGHT_TARGET_ENV=local
   PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000
   PLAYWRIGHT_API_URL=http://127.0.0.1:8080
   SESSION_SECRET=extraSecretSessionSecretValueSssh
   TEST_USER_MANAGER_API_KEY=local-manager-key
   ```

   The session secret above is the committed local example value. If you change it, the frontend and Playwright must use the same value. `TEST_USER_MANAGER_API_KEY` must match `LOCAL_TEST_USER_MANAGER_API_KEY` used to seed the API (default `local-manager-key` in [`api/local.env`](../../api/local.env)). Configure the application's `API_URL` for the local API too; `PLAYWRIGHT_API_URL` only controls the test helpers.

3. From `frontend/`, build the frontend and install browsers:

   ```sh
   npm run build
   npx playwright install --with-deps
   curl --fail http://127.0.0.1:8080/health
   npm run test:e2e -- --list
   PLAYWRIGHT_WORKERS=1 npm run test:e2e
   ```

Playwright starts the built frontend with `npm run start` (`next start`), so rebuild after changing application code. Outside CI it can reuse a server already listening at the base URL; ensure that server is running the code and environment you intend to test. The API must remain running and seeded. One worker is useful when diagnosing interference with shared test data; the configured default is 10 (see [CI parallelization](#how-ci-parallelizes-runs)).

#### Switching between local and deployed environments

Change `PLAYWRIGHT_TARGET_ENV`, both `PLAYWRIGHT_*_URL` values, and the session secret and `TEST_USER_MANAGER_API_KEY` together. Clear any stale shell exports, including `SESSION_SECRET_OVERRIDE`, that would override `.env.local`. Changing only the target does not replace URLs already supplied in your environment. Local URLs default to `http://127.0.0.1:3000` and `http://127.0.0.1:8080` when unset; deployed URLs have no defaults.

The same `TEST_USER_MANAGER_API_KEY` variable is used for every target. CI passes the local seed key for local runs and a secret for deployed runs. Set `PLAYWRIGHT_WORKERS=1` for a manual deployed run to match CI's per-runner concurrency.

### Test groups

Each test must have exactly one execution tag and may have feature tags. Use `VALID_TAGS` from [`tags.ts`](../../frontend/tests/e2e/tags.ts), the source of truth for supported tags:

| Type      | Current tags                 |
| --------- | ---------------------------- |
| Execution | `@smoke`, `@full-regression` |
| Feature   | `@apply-forms`, `@discovery` |

Agree on new groups with the testing and feature teams. Run `npm run test:e2e:validate-tags` after changing tests or workflow filters. The [tag-check workflow](../../.github/workflows/ci-e2e-tags.yml) validates discovered tests and workflow tag references on relevant PRs; it does not need browsers or running application services.

#### Default test cadences

| Trigger                                                                                                                                              | Test selection                            | Target                            |
| ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | --------------------------------- |
| PR touching `api/**`, `frontend/**`, or the E2E workflow/action paths listed in [`ci-frontend-e2e.yml`](../../.github/workflows/ci-frontend-e2e.yml) | `@smoke`, plus conditional coverage below | local                             |
| Push to `main` (except changes confined to `documentation/**` and `analytics/**`)                                                                    | `@smoke` and `@full-regression`           | local                             |
| Successful API or frontend deployment from a push to `main`                                                                                          | `@smoke` and `@full-regression`           | staging                           |
| Daily at 11:00 UTC (`0 11 * * *`)                                                                                                                    | `@smoke` and `@full-regression`           | local and staging                 |
| Production release/deploy through [`cd-release.yml`](../../.github/workflows/cd-release.yml)                                                         | `@smoke` and `@full-regression`           | local and staging, not production |

Staging post-deploy checks are defined in [`cd-api.yml`](../../.github/workflows/cd-api.yml) and [`cd-frontend.yml`](../../.github/workflows/cd-frontend.yml). The [daily workflow](../../.github/workflows/e2e-daily.yml) always passes both execution tags, including on manual dispatch. There is no weekly E2E schedule or `@extended`/`@core-regression` execution group.

For a custom manual run, dispatch the local or [deployed workflow](../../.github/workflows/e2e-deployed-env.yml) with a pipe-separated `playwright_tags` filter (for example, `@smoke|@discovery`); leaving it blank selects all tests. The deployed workflow's `version` selects the test code ref, while `target` selects the running application environment.

#### Conditional test cadences

The [local workflow](../../.github/workflows/ci-frontend-e2e.yml) expands PR coverage based on changed paths:

| Changed files                                                                          | Additional coverage                    |
| -------------------------------------------------------------------------------------- | -------------------------------------- |
| Apply-related paths listed in `changed-apply-form-files`                               | `@apply-forms`                         |
| Discovery-related paths listed in `changed-discovery-files`                            | `@discovery`                           |
| Playwright config, environment handling, `playwrightUtils.ts`, or `tests/e2e/utils/**` | All E2E tests, regardless of tag       |
| E2E spec files (when the utility/config expansion does not apply)                      | An additional run of the changed specs |

The workflow contains the full path lists. Tag expansion changes the selected tests; PRs still run only the `Chrome` project.

#### Browser test cadences

These are Playwright project names, including capitalization and spaces:

| Target/run                                  | Projects                                       |
| ------------------------------------------- | ---------------------------------------------- |
| Local PR checks                             | `Chrome`                                       |
| Local push, daily, release, and manual runs | `Chrome`, `Firefox`, `Webkit`, `Mobile chrome` |
| Deployed runs                               | `Chrome`, `Mobile chrome`                      |

`Chrome` and `Mobile chrome` use Playwright's Chromium devices. `PLAYWRIGHT_PROJECTS` accepts a comma-separated subset of the projects available for the target; unknown names fail configuration. Leaving it unset runs every available project. CI supplies it through the composite action's `playwright_projects` input. When changing CI's project selection, keep the `do-*-install` inputs consistent so the required browser is installed.

Individual specs may skip a browser. In particular, many deployed specs call [`skipNonChromeOnStaging`](../../frontend/tests/e2e/utils/auth/skip-non-chrome-staging-utils.ts), which skips every project except `Chrome` on all nonlocal targets. A configured mobile project therefore does not imply every flow runs on mobile.

#### How CI parallelizes runs

Both workflows split tests across runners and merge their blob reports:

- [`ci-frontend-e2e.yml`](../../.github/workflows/ci-frontend-e2e.yml) uses four shards, each with its own API and frontend. Playwright defaults to 10 workers and `fullyParallel: true` for the local target.
- [`e2e-deployed-env.yml`](../../.github/workflows/e2e-deployed-env.yml) uses six `Chrome` shards and one `Mobile chrome` shard against one shared environment. Each runner has one worker, and `fullyParallel` is false for deployed targets. The reusable workflow shares a concurrency group per target; post-deploy callers also share a cancellation group so the newest post-deploy check takes priority.

[`sharded-test-user-utils.ts`](../../frontend/tests/e2e/utils/auth/sharded-test-user-utils.ts) maps the default `primaryOrgAdmin` identity across a pool of 10 local users. Deployed pools currently contain one user each, and other identities and organization data are shared. Sharding does not eliminate state interference; inspect shared data when tests fail only in parallel.

`TOTAL_SHARDS` and `CURRENT_SHARD` become Playwright's shard settings (both default to 1). Keep each matrix entry's shard number and total consistent. `PLAYWRIGHT_WORKERS` overrides the default worker count.

##### Why the deployed target shards each project separately

Many mobile tests are collected but skipped at runtime, while Chrome executes the longer application flows. Giving each project its own shard count avoids allocating the same number of runners to these unequal workloads.

The composite action explicitly names blob reports `report-<shard_label>.zip` and artifacts `blob-report-shard-<target>-<shard_label>`. The label defaults to the shard number. Separate projects therefore need unique labels, such as `chrome-1` and `mobile-1`, so their reports do not overwrite each other during merging.

### Focused runs and troubleshooting

From `frontend/`:

```sh
# Inspect selected tests without launching browsers or application services.
npm run test:e2e -- --list --project=Chrome --grep '@smoke'

# Run one existing spec, or select a feature group.
npm run test:e2e -- tests/e2e/static-pages/specs/home.spec.ts --project=Chrome
npm run test:e2e -- --project=Chrome --grep '@apply-forms'

# Use Playwright's interactive UI or debugger.
npm run test:e2e:ui
npm run test:e2e -- tests/e2e/static-pages/specs/home.spec.ts --project=Chrome --debug

# Capture a trace on a local run, then open the HTML report.
npm run test:e2e -- tests/e2e/static-pages/specs/home.spec.ts --project=Chrome --trace on
npx playwright show-report
```

Configuration allows three retries in CI and none outside CI. The default per-test timeout is 75 seconds locally and 120 seconds on deployed targets; individual specs may override it. Screenshots are enabled, while traces and video are captured on the first retry. For a local failure with no retries, use `--trace on` as above.

Local runs use the HTML reporter (`frontend/playwright-report`). CI uses blob reports and [`e2e-create-report.yml`](../../.github/workflows/e2e-create-report.yml) uploads `merged-html-report-<target>` artifacts with 30-day retention; individual blob artifacts have one-day retention. Download and extract the merged artifact, then pass its directory to `npx playwright show-report`.

If an environment has no infected-file scanner, set `E2E_INFECTED_FILE_SCANNER=false` to omit the infected-file test branch. It defaults to enabled; see [`submission-printview-attachment-virus-rejection.spec.ts`](../../frontend/tests/e2e/apply/submission/specs/submission-printview-attachment-virus-rejection.spec.ts).

## Unit testing

The frontend uses Jest 30 with Next.js's `next/jest` configuration, React Testing Library, `@testing-library/user-event`, and `@testing-library/jest-dom`. Vitest is not the frontend unit test runner. See [package.json](../../frontend/package.json), [jest.config.js](../../frontend/jest.config.js), and [jest.setup.js](../../frontend/tests/jest.setup.js) for the installed tools and shared setup.

### Running unit tests

Install dependencies with `npm ci` in `frontend/`, using the Node version in [`.nvmrc`](../../frontend/.nvmrc). Run these commands from `frontend/`:

```sh
# Run the full unit suite in CI mode, with coverage
npm test

# Watch tests related to changed files
npm run test-watch

# Run one test file without collecting coverage
npm test -- --coverage=false --runTestsByPath src/components/core/GeneralErrorAlert.test.tsx

# Match a test name within that file
npm test -- --coverage=false --runTestsByPath src/components/core/GeneralErrorAlert.test.tsx --testNamePattern="accessibility"
```

Use `--runTestsByPath` for literal file paths, especially Next.js paths containing brackets or parentheses, and quote those paths in the shell. Jest's positional path filters are regular expressions. Add `--runInBand` to run in a single process when debugging or limiting local resource use.

The [Frontend Checks workflow](../../.github/workflows/ci-frontend.yml) runs linting, type checking, formatting, and the unit suite with coverage. Coverage is reported as text and JSON (`frontend/coverage/coverage-final.json`); there is currently no minimum percentage configured in Jest, and the separate coverage-report action is disabled. We still expect unit tests for behavior changes in the same PR and strive for meaningful coverage, including failure cases, rather than 100% coverage for its own sake.

### Test locations and shared setup

Unit tests are colocated with the code under `frontend/src/`, using `.test.ts` or `.test.tsx` filenames. For example:

- Component: [GeneralErrorAlert.test.tsx](../../frontend/src/components/core/GeneralErrorAlert.test.tsx)
- Route handler: [auth/login/route.test.ts](../../frontend/src/app/api/auth/login/route.test.ts)
- Utility: [zipUtils.test.ts](../../frontend/src/utils/opportunity/zipUtils.test.ts)

`frontend/tests/` contains shared Jest setup, manual mocks, and the Playwright suite. Jest excludes `tests/e2e/`. The default unit test environment is `jsdom`; use the Node environment for route handlers as described below.

Shared setup registers the DOM matchers and `jest-axe`'s `toHaveNoViolations` matcher, sets a mock `process.env.apiUrl`, and mocks the client-side `next-intl` functions `useTranslations` and `useMessages`. Server-side translation functions such as `getTranslations` still need mocks in tests that use them.

Reuse the [testing utilities](../../frontend/src/utils/testing) and fixtures where relevant:

- [fixtures.ts](../../frontend/src/utils/testing/fixtures.ts) and [opportunityMock.ts](../../frontend/src/utils/testing/opportunityMock.ts) supply shared test data.
- [intlMocks.ts](../../frontend/src/utils/testing/intlMocks.ts) supplies translation mocks and `localeParams`.
- [providerMocks.tsx](../../frontend/src/utils/testing/providerMocks.tsx) supplies `FakeQueryProvider` and `createFakeUserContext`.
- [FeatureFlagTestUtils.ts](../../frontend/src/utils/testing/FeatureFlagTestUtils.ts) supplies feature-flag cookie and default-flag mocks.
- [streamTestUtils.ts](../../frontend/src/utils/testing/streamTestUtils.ts) supplies manually advanceable streams for upload tests.

### Accessibility checks

We strive to include axe checks on components alongside their behavior tests. Import `axe` from `jest-axe`, render the component, and await the scan. The matcher is already registered globally. For example, [GeneralErrorAlert.test.tsx](../../frontend/src/components/core/GeneralErrorAlert.test.tsx) includes:

```tsx
import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import GeneralErrorAlert from "src/components/core/GeneralErrorAlert";

it("should not have any accessibility violations", async () => {
  const { container } = render(<GeneralErrorAlert />);
  expect(await axe(container)).toHaveNoViolations();
});
```

For components that render into portals, scan `document.body`; see [SimplerModal.test.tsx](../../frontend/src/components/core/SimplerModal.test.tsx). Automated axe checks complement keyboard and screen-reader testing; they do not establish complete accessibility coverage.

### Debugging

#### VS Code launch configuration

When opening the repository root in VS Code, add the following object to the `configurations` array in [`.vscode/launch.json`](../../.vscode/launch.json):

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest debug current file",
  "cwd": "${workspaceFolder}/frontend",
  "program": "${workspaceFolder}/frontend/node_modules/jest/bin/jest.js",
  "args": [
    "--runInBand",
    "--runTestsByPath",
    "${file}",
    "--coverage=false",
    "--testTimeout=100000000"
  ],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen",
  "skipFiles": ["<node_internals>/**"]
}
```

If you open `frontend/` as the workspace instead, put the configuration in `frontend/.vscode/launch.json`, set `cwd` to `${workspaceFolder}`, and remove `/frontend` from `program`.

Open a unit test file, set a breakpoint, and select **Jest debug current file** in **Run and Debug**. `--runInBand` keeps tests in the debugger's process, and the extended timeout gives you time to inspect breakpoints. `--runTestsByPath` handles paths containing `[locale]`, `[id]`, or `(base)` without interpreting them as regular expressions; it replaces the obsolete `--testPathPattern` example.

#### Jest / Vitest Runner extension

Alternatively, install [Jest / Vitest Runner (`firsttris.vscode-jest-runner`)](https://marketplace.visualstudio.com/items?itemName=firsttris.vscode-jest-runner) and open `frontend/` as your VS Code workspace so the extension finds its package and Jest configuration. Open a unit test file and use the **Debug** CodeLens above a test, or open the Command Palette (**Cmd+Shift+P** on macOS, **Ctrl+Shift+P** on Windows/Linux) and select **Debug Jest**. Despite the extension's name, these frontend tests run with Jest. For repository-root or multi-package workspaces, see the extension's [configuration guidance](https://github.com/firsttris/vscode-jest-runner#configuration).

### Helpful common patterns

#### Async components

For async server components, mock their server dependencies, call the component as a function with its props, await its result, and render the returned JSX. The current [ActiveUsersSection test](<../../frontend/src/app/[locale]/(base)/workspace/organizations/[id]/manage-users/_components/ActiveUsersSection.test.tsx>) uses this pattern:

```tsx
const component = await ActiveUsersSection({
  organizationId: "org-123",
  activeUsers,
  roles,
});
render(component);
```

This isolates the component's output; it does not reproduce the full server-component lifecycle. Continue to render client components that use hooks as JSX through Testing Library.

#### Route tests

Route-handler tests use the Node environment for `Request`, `Response`, and Next.js server APIs. Put this docblock at the top of the test file, before imports:

```js
/**
 * @jest-environment node
 */
```

See [auth/login/route.test.ts](../../frontend/src/app/api/auth/login/route.test.ts) for a route test using `NextRequest`.

Tests that need both the DOM and Node's web APIs can use the existing [JsdomNodeEnvironment](../../frontend/src/utils/testing/jsdomNodeEnvironment.ts):

```js
/**
 * @jest-environment ./src/utils/testing/jsdomNodeEnvironment.ts
 */
```

For an example, see [FeatureFlagManager.test.ts](../../frontend/src/services/featureFlags/FeatureFlagManager.test.ts). This environment adds `Request`, `Response`, `ReadableStream`, `AbortController`, `File`, and `FormData` to jsdom.

#### Expected errors

Next.js redirects throw an error by design. [wrapForExpectedError](../../frontend/src/utils/testing/commonTestUtils.ts) awaits a callback and returns the caught error so assertions can remain outside a `catch` block. Always assert the expected message or redirect digest: if the callback does not throw, the helper returns a `NoErrorThrownError`, so merely checking that an error object exists is insufficient.

Current examples:

- [auth/login/route.test.ts](../../frontend/src/app/api/auth/login/route.test.ts) checks `NEXT_REDIRECT`, the destination, and the status in the redirect digest.
- [WidgetRenderers.test.tsx](../../frontend/src/components/apply-form/widgets/WidgetRenderers.test.tsx) checks the message for an unsupported widget type.
