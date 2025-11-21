The Simpler Grants Next application is deployed and used in a number of environments. Here is how those environments, and the data required by each environment, are managed.

## General Things

Note that Next applications follow a set heirarchy for evaluating environment variable precedence, as noted [in documentation here](https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables#environment-variable-load-order).

Secret environment variables, and others that should be controlled specifically based on deployed environment, are specified in terraform, which pulls them from SSM and sets them on the service definition, which passes them from the ECS task definition to the Next container. See [code referenced here](https://github.com/HHS/simpler-grants-gov/blob/main/infra/frontend/app-config/env-config/environment-variables.tf).

All environment variables referenced in the app should be handled in the [environments file here](https://github.com/HHS/simpler-grants-gov/blob/main/frontend/src/constants/environments.ts)].

## NODE_ENV

NextJS will set the Node `NODE_ENV` variable automatically depending on how you start the server.

- `next dev` - "development"
- `next build && next start` - "production"

Next hasn't documented this behavior super well - the best reference I can find is in [this discussion thread](https://github.com/vercel/next.js/discussions/13410#discussioncomment-18760).

This behavior means that, since we use `build & start` in all of our deployed environments and E2E test runs, we cannot use rely on `NODE_ENV` to give us a meaningful value about which environment the process is running in. To work around this, any environment variables that should be dependent on the deployed environment (ie "dev", "staging", "prod"), should likely be referenced as a secret from SSM as described above.

## Local

Environment variables are gathered from the .env.development file.

When running Next in a non-dockerized situation, variables are also pulled directly from your command line or environment. Ex. `API_URL=http://google.com next run dev`.

Since the .env.development file is tracked in git, any sensitive environment variables used for local development or testing - for example to connect to a non-dev API instance - **SHOULD NOT** be entered into this file, even temporarily. Instead, pass any necessary env vars directly from the command line or look into something like [direnv](https://direnv.net/).

The `AUTH_EXPIRATION_TIME` environment variable will allow you to control the time your login token will remain valid. The value in .env.development is 1 year, but you can set a different value as needed in .env.local. This variable is only functional when `ENVIRONMENT` is "local".

## Test (and testing)

Unit testing by Jest is always done in the "test" environment by default. See [Jest's docs](https://jestjs.io/docs/environment-variables#node_env). As a result, all Jest runs will reference the .env.test or .env.local (which is used in CI).

E2E tests are run against a running Next server, so the environment used there is determined by the environment used on by whatever type of Next server is running.

In CI E2E tests use `npx playwright test`, which will run `next start` pointing at a production build of the application. To work aroudn this our CI code copies .env.development values into a .env.local file that will take precedence over .env.production. Note that NODE_ENV will still be set to "production".

See [our CI code](https://github.com/HHS/simpler-grants-gov/blob/1b85220c7369d40ab2f690050ece41be91c91b7f/.github/workflows/ci-frontend-e2e.yml#L58) for more details.

## Development / Staging / Production

Note that, as mentioned above, NODE_ENV will be set to "production" here due to use of `npm run build && npm start`.

As a result, environment variables are gathered from the .env.production file.

## Deployment

[Check out this diagram](https://lucid.app/lucidchart/107dcf47-46e7-4088-a90a-1ef3b0ca3744/edit?viewport_loc=42%2C439%2C2295%2C1182%2C0_0&invitationId=inv_3559eb81-f735-4b22-9365-49920268e061). This should explain most of what the next section explains, and more but in visual form.

Will add image directly to document later.

### Tricky Stuff

Docker and Next (and ECS) combine to create an interesting situation when trying to figure out how to provide environment variables to the deployed application. Here are a few interesting facts:

- any environment variables that we want to be directly available in client code in a Next app need to be prefixed with the `NEXT_PUBLIC_` string. See [Next docs here](https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables#bundling-environment-variables-for-the-browser).
- any `NEXT_PUBLIC_` variables must be initially referenced in the code directly from process.env (`const yrVar = process.env.NEXT_PUBLIC_YR_VAR`), rather than destructured (`const { NEXT_PUBLIC_YR_VAR } = process.env`)), but can be exported from one file to another after definition
- these variables must be available at build time (ie `next build` rather than `next start`), and can be referenced in any components when exported from a server side file, directly referenced from process.env, or passed as a prop
- however, currently, all environment variables are passed from the ECS task definition to the application at Docker run time. This means that the `NEXT_PUBLIC_` prefix and usage as described above is not effective in our application
- since variables defined at Docker runtime cannot be not made available directly to client components via an import or process.env reference, to make any environment variables available to client components, we will need to
  - import the variable into a server component
  - pass it as a prop to client component child, or implement it within a context provider
