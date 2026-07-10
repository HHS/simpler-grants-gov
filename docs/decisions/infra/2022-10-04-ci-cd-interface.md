# CI/CD Interface

- Status: accepted
- Deciders: @lorenyu @kyeah
- Date: 2022-10-04

Technical Story: Define Makefile interface between infra and application [#105](https://github.com/navapbc/template-infra/issues/105)

## Context and Problem Statement

In order to reuse CI and CD logic for different tech stacks, we need to establish a consistent interface by which different applications can hook into the common CI/CD infrastructure.

## Decision Drivers

- We want to define most of the release management logic in `template-infra` but allow application specific methods for building the release.
- The build needs to be able to be run from the CD workflow defined in `template-infra`, but it also needs to be able to be run from the application as part of the CI workflow as one of the CI checks.

## Proposal

### CD interface

Create a `Makefile` in `template-infra` repo that defines the following make targets:

```makefile
###################
# Building and deploying
##################

# Generate an informational tag so we can see where every image comes from.
release-build: # assumes there is a Dockerfile in `app` folder
  ... code that builds image from app/Dockerfile

release-publish:
  ... code that publishes to ecr

release-deploy:
  ... code that restarts ecs service with new image
```

Each of the template applications (template-application-nextjs, template-application-flask) needs to have a `Makefile` in `app/` e.g. `template-application-flask/app/Makefile` with a `release-build` target that builds the release image. The `release-build` target should take an `OPTS` argument to pass into the build command to allow the parent Makefile to pass in arguments like `--tag IMAGE_NAME:IMAGE_TAG` which can facilitate release management.

```makefile
# template-application-flask/app/Makefile

release-build:
  docker build $(OPTS) --target release .
```

By convention, the application's Dockerfile should have a named stage called `release` e.g.

```Dockerfile
# template-application-flask/app/Dockerfile
...
FROM scratch AS release
...
```

### CI interface

Each application will have its own CI workflow that gets copied into the project's workflows folder as part of installation. `template-application-nextjs` and `template-application-flask` will have `.github/workflows/ci-app.yml`, and `template-infra` will have `.github/workflows/ci-infra.yml`.

Installation would look something like:

```bash
cp template-infra/.github/workflows/* .github/workflows/
cp template-application-nextjs/.github/workflows/* .github/workflows/
```

CI in `template-application-next` might be something like:

```yml
# template-application-nextjs/.github/workflows/ci-app.yml

jobs:
  lint:
    steps:
      - run: npm run lint
  type-check:
    steps:
      - run: npm run type-check
  test:
    steps:
      - run: npm test
```

CI in `template-application-flask` might be something like:

```yml
# template-application-nextjs/.github/workflows/ci-app.yml

jobs:
  lint:
    steps:
      - run: poetry run black
  type-check:
    steps:
      - run: poetry run mypy
  test:
    steps:
      - run: poetry run pytest
```

For now, we are assuming there's only one deployable application service per repo, but we could evolve this architecture to have the project rename `app` as part of the installation process to something specific like `api` or `web`, and rename `ci-app.yml` appropriately to `ci-api.yml` or `ci-web.yml`, which would allow for multiple application folders to co-exist.

## Alternative options considered for CD interface

1. Application template repos also have their own release-build command (could use Make, but doesn't have to) that is called as part of the application's ci-app.yml. The application's version of release-build doesn't have to tag the release, since the template-infra version will do that:

   - Cons: build command in two places, and while 99% of the build logic is within Dockerfile and code, there's still a small chance that difference in build command line arguments could produce a different build in CI than what is used for release

2. We can run release-build as part of template-infra's ci-infra.yml, so we still get CI test coverage of the build process

   - Cons: things like tests and linting in ci-app.yml can't use the docker image to run the tests, which potentially means CI and production are using slightly different environments
