# Custom project linters

## Introduction

This section of the codebase contains a set of custom linters that we run against our GitHub repo and the associated GitHub projects.

## Project directory structure

Outlines the structure of the linters codebase, relative to the root of the simpler-grants-gov repo.

```text
root
├── .github
│   └── linters
│       └── queries    Contains graphql queries used by the custom linting scripts
│       └── scripts    Contains scripts that lint the codebase, GitHub repo, or GitHub projects
│       └── tmp        Git ignored directory that can store temporary outputs of scripts
```

## Usage

### Review automated linters

| Workflow name                                                                 | Description                                                                 | Trigger                        |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------ |
| [Lint - Set points and sprint][set-points-and-sprint]                         | Sets default points and sprint value (if unset) when issues are closed       | On issue close                 |
| [Lint - Check wiki links][check-wiki-links]                                   | Checks that all wiki markdown files are linked in the SUMMARY.md             | Each PR that modifies the wiki |
| [Lint - Inherit parent milestone][inherit-parent-milestone]                   | Inherits the milestone from the parent issue to the issue and its sub-issues | On issue open                  |
| [Lint - Propagate milestone to sub-issues][propagate-milestone-to-sub-issues] | Propagates the milestone from the parent issue to its sub-issues             | On issue milestone change       |

### Manually run the linters

> [!NOTE]
> Only project maintainers can manually run the linters

1. Navigate to the [GitHub actions tab of the repo](https://github.com/HHS/simpler-grants-gov/actions).
2. Find the name of the workflow in the left hand side of the "Actions" menu. It should start with `Lint -`.
3. Click on the workflow you want to trigger manually.
4. On the next page, click the dropdown menu that says "Run workflow".
5. Choose the version of the workflow you want to run based on its branch. **Note:** In most cases this will be `Branch: main`.
6. Finally, click the green "Run workflow" button to trigger that linter.

### Add a new linter

1. Create a new linting script in `linters/scripts/`.
   - **Note:** If you're script requires a long graphql query for the GitHub graphql API, pull that query out into its own `.graphql` file stored in `linters/queries/`.
   - **Note:** If you're script changes any resources directly in GitHub, make sure you include a dry run option that skips over any write step if the `--dry-run` flag is passed during execution.
   - For a reference please see [`linters/scripts/set-points-and-sprint.sh`][set-points-and-sprint-script] and its associated query [`linters/queries/get-project-items.graphql`][get-project-items-query]
2. Update the permissions on your script so it can be executed: `chmod 744 ./scripts/<path-to-script>`
3. Test your script locally `./scripts/<path-to-script> --dry-run`
4. Add your script to the [CI checks for the linters](../workflows/ci-project-linters.yml). Make sure you include any environment variables needed by your script and the `--dry-run` flag in the GitHub action `run` statement.
5. Create a new GitHub action workflow to run your linter.
   - **Note:** Make sure the name of the yaml file is prefixed with `lint-` (or `ci-` if run on PRs).
   - **Note:** Make sure the workflow is run from the `linters/` sub-directory.
   - **Note:** Make sure the workflow has a `workflow_dispatch:` trigger option to allow for manual triggers.
   - For a reference, please see [`.github/workflows/lint-set-points-and-sprint.yml`][set-points-and-sprint]
6. Add your new linter to the table in the ["Review automated linters"](#review-automated-linters) section above


[set-points-and-sprint]: ../workflows/lint-set-points-and-sprint.yml
[set-points-and-sprint-script]: ./scripts/set-points-and-sprint.sh
[get-project-items-query]: ./queries/getItemMetadata.graphql
[check-wiki-links]: ../workflows/ci-wiki-links.yml
[inherit-parent-milestone]: ../workflows/lint-inherit-parent-milestone.yml
[propagate-milestone-to-sub-issues]: ../workflows/lint-propagate-milestone-to-sub-issues.yml
