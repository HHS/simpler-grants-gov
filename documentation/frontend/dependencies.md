# Frontend Dependency Management (Node Modules)

For the most part, frontend dependencies on this project are managed in a very routine way using NPM. A few things are worth calling out

## Vulnerabilities and overrides

When high or medium level vulnerabilities appear in our security scans, we are required to either ignore them (if we can attest that they do not pose a risk) or resolve them prior to the next production deploy. Since this creates a good amount of urgency to act, and it is a relatively frequent occurance for a security vulnerability to appear in an npm dependency or subdependency, it is important to follow these guidelines when resolving vulnerabilities.

### When a vulnerability can't be patched

If a fix is not available for a vuilnerability found in our project, this could block deployment until a fix is availble. A couple of options:

- remove the dependency. If there is a workaround for including the dependency that allows us to remove it, we can do that, at least temporarily. If the vulnerable package is not maintained, then this is likely the direction we will want to take.
- ignore the vulnerability. If we can be reasonably assured that the risk of using the vulnerable package is low in the context of our application, we can at least temporarily ignore the vulnerability until it is patched.
- escalate a fix. If it's determined that we can't move forward without a fix, we can raise this situation to HHS leadership, the package maintainers, or anyone that will listen in hope that it leads to a quicker fix.

### Vulnerabilities in top level dependencies

- Top level dependencies should be patched directly
- Overrides should not be used
  - Except in the rare case that the vulnerable package is also included as an unpatched subdependency

### Vulnerabilities in dev dependencies

- If possible, dev dependencies should be patched directly
- If it is not feasible to patch a dev dependency, the vulnerability can be ignored if
  - We can be sure that the package is not and does not need to be included in our final production Dockerfile

### Vulnerabilities in subdependencies

- The first thing to do when a vulnerable subdependency surfaces is to research
  - What is the subdependency's dependency path? Which top level dependency can we trace the subdependency back to?
    - Tools like [npm-dependency-graph](https://github.com/TypeFox/npm-dependency-graph) or [npmgraph](https://npmgraph.js.org/) can help
  - Can we patch the top level dependency in a way that resolves the vulnerability? Does the top level dependency have a patched version that includes a patched version of the subdependency?
    - Sometimes if the subdependency is specified with a caret or tilde range, we can force a resolution by deleting our lockfile and running a fresh install
- Dependencies with vulnerable subdependencies should be patched to a version that do not contain vulnerable subdepencies where possible
- If a patched top level dependency version does not exist, but a patched subdependency version does, the best option is create an override in the package.json for the subdependency
  - This will force the application to use the patched version, while we wait for the top level dependency to implement the patch
  - Whenever this is done
    - This document should be uploaded with information uncovered in the research from step one, as well as what the initial vulnerability forcing the override was
    - A ticket should be created for revisiting the situation at a later date to see if the top level dependency has introduced a patched version

## Keeping dependencies up to date

TBD

### Node

On cadence TBD, check the current node version used by [the 24-bookworm-slim Dockerfile in Dockerhub](https://hub.docker.com/layers/library/node/24-bookworm-slim). This is the image used in our frontend Dockerfile, so this dictates the actual node version that our production build and runtime processes will use. If the version specified by the `NODE_VERSION` env var here is different from the version in the [engines declaration in our package.json](https://github.com/HHS/simpler-grants-gov/blob/ef46fd680a4b1fbe0972da0ebac96e788b8592a4/frontend/package.json#L6) and [our .nvmrc](https://github.com/HHS/simpler-grants-gov/blob/main/frontend/.nvmrc), the version referenced in those places needs to be updated.

Whenever this version is updated, make sure to run a fresh `npm i` on the project as well, and commit any changes to the lockfile so we avoid lockfile mismatches in CI.

## Testing

When updating a dependency, the application must be tested to ensure that it still works as expected.

Directions TBD

## Current overrides

The list below is meant as a running list of overrides, explaining their current state and path towards resolution.

### next-navigation-guard

This package has been patched to support next 16, but that patched version has never been deployed to NPM. We could work around this by going directly to github for the package, but this override works just as well, since the latest version doesn't contain any other important changes. Unclear if the maintainer will bother posting updates to npm in the future, so this may need to stay here. Eventually we may want to copy-paste or find a different solution here since the package is not well maintained.

### ws

WS (websockets) has a vulnerability in 8.20.1 up to 8.21.

It is referenced at ^8.20.0 in puppeteer-core v24.43.1
It is referenced at ^8.18.0 in jsdom v26.1.0
It is referenced at ^8.18.0 in storybook v10.5.3

Tracking this in https://github.com/HHS/simpler-grants-gov/issues/11636

### sharp

v0.34.5 contains a vuln fixed in v 0.35.0. Latest stable next version (16.2.x) does not contain a patch, but latest canary (16.3.x) does so a fix should be forthcoming shortly.

### postcss

v8.4.31 contains a vuln fixed in v8.5.10. 8.5.10 is included as top level dep, but next 16.2.x includes v8.4.31 so will need to wait until a patch comes out in next to remove the override
