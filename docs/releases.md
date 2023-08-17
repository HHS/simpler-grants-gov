# Release Management

## Building a release

To build a release, run

```bash
make release-build
```

This builds the release from [app/Dockerfile](../app/Dockerfile). The Dockerfile
needs to have a build stage called `release` to act as the build target.
(See [Name your build stages](https://docs.docker.com/build/building/multi-stage/#name-your-build-stages))

## Publishing a release

TODO

## Deploying a release

TODO
