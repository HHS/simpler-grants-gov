# Release Management

## Building a release

To build a release, run

```bash
make release-build APP_NAME=<APP_NAME>
```

This calls the `release-build` target in `<APP_NAME>/Makefile` with some
parameters to build an image. The `<APP_NAME>/Dockerfile` should have a build
stage called `release` to act as the build target. (See [Name your build
stages](https://docs.docker.com/build/building/multi-stage/#name-your-build-stages))

You may pass `IMAGE_NAME` and `IMAGE_TAG` arguments if wanting to control those
aspects of the built image, but typically leave them at the defaults, which will
be based on `APP_NAME` and latest commit hash, respectively.

## Publishing a release

```bash
make release-publish APP_NAME=<APP_NAME>
```

## Deploying a release

```bash
make release-deploy APP_NAME=<APP_NAME> ENVIRONMENT=<ENV>
```

## All together

Typically the release process is automated based on merges to release branches
or through invoked GitHub Actions, but if wanting to make a test deploy for some
local application changes, could do something like:

```sh
make release-build release-publish release-deploy APP_NAME=<APP_NAME> ENVIRONMENT=<ENV>
```

(you may also need `release-run-database-migrations` in there before `release-deploy`, but be careful)
