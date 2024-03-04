## Overview

- This is a [Next.js](https://nextjs.org/) React web application, written in [TypeScript](https://www.typescriptlang.org/).
- [U.S. Web Design System](https://designsystem.digital.gov) provides themeable styling and a set of common components.
- [React-USWDS](https://github.com/trussworks/react-uswds) provides React components already with USWDS theming out of the box. For a reference point starting out, see `react-uswds-hello.tsx` which includes examples of react-uswds component usage.
- [Storybook](https://storybook.js.org/) is included as a frontend workshop.

### Directory structure

```
├── .storybook        # Storybook configuration
├── public            # Static assets
│   └── locales       # Internationalized content
├── src               # Source code
│   ├── components    # Reusable UI components
│   ├── pages         # Page routes and data fetching
│   │   ├── api       # API routes (optional)
│   │   └── _app.tsx  # Global entry point
│   └── styles        # Sass & design system settings
├── stories           # Storybook pages
└── tests
```

## 💻 Development

[Next.js](https://nextjs.org/docs) provides the React framework for building the web application. Pages are defined in the `pages/` directory. Pages are automatically routed based on the file name. For example, `pages/index.tsx` is the home page.

Files in the `pages/api` are treated as [API routes](https://nextjs.org/docs/api-routes/introduction). An example can be accessed at [localhost:3000/api/hello](http://localhost:3000/api/hello) when running locally.

[**Learn more about developing Next.js applications** ↗️](https://nextjs.org/docs)

### Getting started

The application can be ran natively or in a Docker container.

#### Native

There are several secret environment variables necessary to submit the form related to the newsletter. Duplicate the `/frontend/env.development` file and name the copy `/frontend/.env.local`, which will not be checked into github. Fill in the three variables related to Sendy. Ask another engineer on the team for those values if you don't have them.

From the `frontend/` directory:

1. Install dependencies
   ```bash
   npm install
   ```
1. Optionally, disable [telemetry data collection](https://nextjs.org/telemetry)
   ```bash
   npx next telemetry disable
   ```
1. Run the local development server
   ```bash
   npm run dev
   ```
1. Navigate to [localhost:3000](http://localhost:3000) to view the application

##### Other scripts

- `npm run build` - Builds the production Next.js bundle
- `npm start` - Runs the Next.js server, after building the production bundle

#### Docker

Alternatively, you can run the application in a Docker container.

From the `frontend/` directory:

1. Run the local development server
   ```bash
   make dev
   ```
1. Navigate to [localhost:3000](http://localhost:3000) to view the application

- If installing new packages locally with npm and using `make dev` with docker to run locally, you may need to run `make build` first to bring the new packages into the container

##### Testing Release Target Locally

To test the release target locally, run:

- `make release-build OPTS="--tag [IMAGE_NAME]"` or
- `docker buildx build --target release --tag [IMAGE_NAME]` for a faster build on OSX

to build a local image. To view the site at `localhost:3000`, run: `docker run -e "HOSTNAME=0.0.0.0" -p 3000:3000 [IMAGE_NAME]`.

## 🖼️ Storybook

Storybook is a [frontend workshop](https://bradfrost.com/blog/post/a-frontend-workshop-environment/) for developing and documenting pages and components in isolation. It allows you to render the same React components and files in the `src/` directory in a browser, without the need for a server or database. This allows you to develop and manually test components without having to run the entire Next.js application.

See the [Storybook Next.js documentation](https://github.com/storybookjs/storybook/tree/next/code/frameworks/nextjs) for more information about using Storybook with Next.js

Similar to the Next.js application, Storybook can be ran natively or in a Docker container.

#### Native

From the `frontend/` directory:

1. `npm run storybook`
2. Navigate to [localhost:6006](http://localhost:6006) to view

##### Other scripts

- `npm run storybook-build` - Exports a static site to `storybook-static/`

#### Docker

Alternatively, you can run Storybook in a Docker container.

From the `frontend/` directory:

1. `make storybook`
2. Navigate to [localhost:6006](http://localhost:6006) to view

## 🐛 Testing

[Jest](https://jestjs.io/docs/getting-started) is used as the test runner and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro) provides React testing utilities.

Tests are manged as `.test.ts` (or `.tsx`) files in the the `tests/` directory.

To run tests:

- `npm test` - Runs all tests and outputs test coverage report
- `npm run test-update` - Updates test snapshots
- `npm run test-watch` - Runs tests in [watch](https://jestjs.io/docs/cli#--watch) mode. Tests will re-run when files are changed, and an interactive prompt will allow you to run specific tests or update snapshots.

A subset of tests can be ran by passing a pattern to the script. For example, to only run tests in `tests/pages/`:

```sh
npm run test-watch -- pages
```

## 🚦 End-to-end (E2E) testing

[Playwright](https://playwright.dev/) is a framework for web testing and its test runner is called [Playwright Test](https://playwright.dev/docs/api/class-test), which can be used to run E2E or integration tests across chromium, firefox, and webkit browsers.

E2E test filenames end with `.spec.ts` and are found in the `tests/e2e` directory.

To run E2E tests via CLI:

- `npm run test:e2e` — Runs all E2E tests using the playwright config found at `tests/playwright.config.ts`
- `npm run test:e2e:ui` — Run specific or all E2E tests using Playwright's [UI mode](https://playwright.dev/docs/test-ui-mode), which is useful for debugging full traces of each test

To run E2E tests using VS Code:

1. Download the VS Code extension described in these [Playwright docs](https://playwright.dev/docs/running-tests#run-tests-in-vs-code)
2. Follow the [instructions](https://playwright.dev/docs/getting-started-vscode#running-tests) Playwright provides

In CI, the "Front-end Checks" workflow (`.github/workflows/ci-frontend.yml`) summary will include an "Artifacts" section where there is an attached "playwright-report". [Playwright docs](https://playwright.dev/docs/ci-intro#html-report) describe how to view HTML Report in more detail.

## 🤖 Type checking, linting, and formatting

- [TypeScript](https://www.typescriptlang.org/) is used for type checking.
  - `npm run ts:check` - Type checks all files
- [ESLint](https://eslint.org/) is used for linting. This helps catch common mistakes and encourage best practices.
  - `npm run lint` - Lints all files and reports any errors
  - `npm run lint-fix` - Lints all files and fixes any auto-fixable errors
- [Prettier](https://prettier.io/) is used for code formatting. This reduces the need for manual formatting or nitpicking and enforces a consistent style.
  - `npm run format`: Formats all files
  - `npm run format-check`: Check files for formatting violations without fixing them.

It's recommended that developers configure their code editor to auto run these tools on file save. Most code editors have plugins for these tools or provide native support.

<details>
  <summary>VSCode instructions</summary>

1. Install the [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) and [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) extensions.
2. Add the following to a `.vscode/settings.json` Worspace Settings file:

   ```json
   {
     "editor.codeActionsOnSave": {
       "source.fixAll.eslint": true
     },
     "editor.formatOnSave": true,
     "editor.defaultFormatter": "esbenp.prettier-vscode",
     "eslint.workingDirectories": ["./frontend"],
     "typescript.validate.enable": true
   }
   ```

   For these tools to auto run, the settings must be located in the root of your current VSCode workspace. For example, if you open the `frontend/` directory in VSCode, the settings should be located at `frontend/.vscode/settings.json`. If you then open then root repository directory in VSCode as your workspace, these tools will not auto run. (Note that adding the settings to the root repository directory may affect other parts of a monorepo.)

   You can alternatively add the settings to your User Settings, however they will apply globally to any workspace you open. See [User and Workspace Settings](https://code.visualstudio.com/docs/getstarted/settings) for more guidance.

</details>

## Other topics

- [Internationalization](../documentation/frontend/internationalization.md)
- [Feature Flags](../documentation/frontend/featureFlags.md)
- Refer to the [architecture decision records](../documentation/decisions) for more context on technical decisions.
