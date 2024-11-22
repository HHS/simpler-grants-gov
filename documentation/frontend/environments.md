The Simpler Grants Next application is deployed and used in a number of environments. Here is how those environments, and the data required by each environment, are managed.

Note that Next applications follow a set heirarchy for evaluating environment variable precedence, as noted [in documentation here](https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables#environment-variable-load-order).

## Local

Environment variables are gathered from the .env.development file.

When running Next in a non-dockerized situation, variables are also pulled directly from your command line or environment. Ex. `API_URL=http://google.com next run dev`.

Since the .env.development file is tracked in git, any sensitive environment variables used for local development or testing - for example to connect to a non-dev API instance - **SHOULD NOT** be entered into this file, even temporarily. Instead, pass any necessary env vars directly from the command line or look into something like [direnv](https://direnv.net/).

## Test (and testing)

Unit testing by Jest is always done in the "test" environment by default. See [Jest's docs](https://jestjs.io/docs/environment-variables#node_env). As a result, all Jest runs will reference the .env.test file.

E2E tests are run against a running Next server, so the environment used there is determined by the environment used on by whatever type of Next server is running. Locally, this should be Development when using `npm run dev` and Production if you're using `npm run build && npm start`.

In CI E2E tests use `npx playwright test`, which will run `next start` pointing at a build of the application that, while using values from the tracked .env.development file, will set the NODE_ENV as "production" following general rules for `next build`. This is because of a largely undocumented behavior where `next build` by default sets NODE_ENV to "production". [This discussion thread](https://github.com/vercel/next.js/discussions/13410#discussioncomment-18760) may be the only place I've seen this clearly documented.

See [our CI code](https://github.com/HHS/simpler-grants-gov/blob/1b85220c7369d40ab2f690050ece41be91c91b7f/.github/workflows/ci-frontend-e2e.yml#L58) for more details.

## Development

The Development environment is deployed and available at [http://frontend-dev-1739892538.us-east-1.elb.amazonaws.com/](http://frontend-dev-1739892538.us-east-1.elb.amazonaws.com/).

Note that, as mentioned above, NODE_ENV will be set to "production" here due to use of `npm run build && npm start`.

As a result, environment variables are gathered from the .env.production file.

## Staging

The Development environment is deployed and available at [http://frontend-staging-1506108424.us-east-1.elb.amazonaws.com/](http://frontend-staging-1506108424.us-east-1.elb.amazonaws.com/).

Note that, as mentioned above, NODE_ENV will be set to "production" here due to use of `npm run build && npm start`.

As a result, environment variables are gathered from the .env.production file.

## Production

The Development environment is deployed and available at [https://simpler.grants.gov/](https://simpler.grants.gov/).

Environment variables are gathered from the .env.production file.
