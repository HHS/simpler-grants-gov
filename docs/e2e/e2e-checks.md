# End-to-End (E2E) Tests

## Overview

This repository uses [Playwright](https://playwright.dev/) to perform end-to-end (E2E) tests. The tests can be run locally (natively or within Docker), but they also run on [Pull Request preview environments](/docs/infra/pull-request-environments.md). This ensures that any new code changes are validated through E2E tests before being merged.

By default in CI, tests are sharded across 3 concurrent runs to reduce total runtime. As the test suite grows, consider increasing the shard count to further optimize execution time. This is set in the [workflow file](../../.github/workflows/e2e-tests.yml#L22).

## Folder Structure
In order to support e2e for multiple apps, the folder structure will include a base playwright config (`/e2e/playwright.config.js`), and app-specific derived playwright config that override the base config. See the example folder structure below:
```
- e2e
  - playwright.config.js
  - app/
    - playwright.config.js
    - tests/
      - index.spec.js
  - app2/
    - playwright.config.js
    - tests/
      - index.spec.js
```

Some highlights:
>- By default, the base config is defined to run on a minimal browser-set (desktop and mobile chrome). Browsers can be added in the app-specific playwright config.
>- Snapshots will be output locally (in the `/e2e` folder or the container) - or in the artifacts of the CI job
>- HTML reports are output to the `playwright-report` folder
>- Accessibility testing can be performed using the `@axe-core/playwright` package (https://playwright.dev/docs/accessibility-testing)

## Run tests locally

### Run tests with docker (preferred)

First, make sure the application you want to test is running.

Then, run end-to-end tests using Docker with:
```bash
make e2e-test APP_NAME=app BASE_URL=http://host.docker.internal:3000
```

>*Note that `BASE_URL` cannot be `localhost`


### Run tests natively

First, make sure the application you want to test is running.

To run end-to-end tests natively, first install Playwright with:

```bash
make e2e-setup
```

Then, run the tests with your app name and base url:
```bash
make e2e-test-native APP_NAME=app
```

>* `BASE_URL` is optional for both `e2e-test-native` and `e2e-test-native-ui` targets. It will by default use the app-specific (`/e2e/<APP_NAME>/playwright.config.js`) `baseURL`

### Run tests in UI mode

When developing or debugging tests, it’s often helpful to see them running in real-time. You can achieve this by running the e2e tests in UI mode:

```
make e2e-test-native-ui APP_NAME=app
```


#### Run tests in parallel

The following commands split test execution into 3 separate shards, with results consolidated into a merged report located in `/e2e/blob-report`. This setup emulates how the sharded tests run in CI.
```
# ensure app is running on port 3000

make e2e-test APP_NAME=app BASE_URL=http://host.docker.internal:3000 TOTAL_SHARDS=3 CURRENT_SHARD=1 CI=true && \
make e2e-test APP_NAME=app BASE_URL=http://host.docker.internal:3000 TOTAL_SHARDS=3 CURRENT_SHARD=2 CI=true && \
make e2e-test APP_NAME=app BASE_URL=http://host.docker.internal:3000 TOTAL_SHARDS=3 CURRENT_SHARD=3 CI=true

make e2e-merge-reports REPORT_PATH=blob-report # merge the blob reports into html
make e2e-show-report # open the html report in browser
make e2e-clean-report # clean the report folders
```

### Viewing the report
If running in docker, the report will be copied from the container to your local `/e2e/playwright-report` folder. If running natively, the report will also appear in this same folder.

To quickly view the report, you can run:

```bash
make e2e-show-report
```

To clean the report folder you can run:

```bash
make e2e-clean-report
```

>*On CI, the report shows up in the GitHub Actions artifacts tab


### PR preview environments

The E2E tests are triggered in PR preview environments on each PR update. For more information on how PR environments work, please refer to [PR Environments Documentation](/docs/infra/pull-request-environments.md).

### Workflows

The following workflows trigger E2E tests:
- [PR Environment Update](../../.github/workflows/pr-environment-checks.yml)
- [E2E Tests Workflow](../../.github/workflows/e2e-tests.yml)

The [E2E Tests Workflow](../../.github/workflows/e2e-tests.yml) takes a `service_endpoint` URL and an `app_name` to run the tests against specific configurations for your app.

## Configuration

The E2E tests are configured using the following files:
- Base Configuration in `/e2e/playwright.config.js`
- App-specific Configuration in `/e2e/<APP_NAME>/playwright.config.js`

The app-specific configuration files extend the common base configuration.

By default when running `make e2e-test APP_NAME=app BASE_URL=http://localhost:3000 ` - you don't necessarily need to pass an `BASE_URL` since the default is defined in the app-specific playwright config (`/e2e/<APP_NAME>/playwright.config.js`).
