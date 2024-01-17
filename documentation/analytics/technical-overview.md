# Technical Overview

## Key technologies

The analytics package is written in Python, analyzes and visualizes data using pandas and plotly, and exposes a command line interface using typer:

- [pandas][pandas-docs] ([source code][pandas-source]) - Used to manipulate and analyze data
- [plotly][plotly-docs] ([source code][plotly-source]) - Used to visualize the results of analysis
- [typer][typer-docs] ([source code][typer-source]) - Used to build the CLI for the analytics package
- [dynaconf][dynaconf-docs] ([source code][dynaconf-source]) - Used to manage configuration variables and secrets

## Integrations

In order to export data for analysis and then share the results of that analysis, the analytics package integrates with multiple third-party tools. These integrations are managed in the `src/analytics/integrations` sub-directory, with each integration managed by its own module.

### GitHub

- [GitHub module](../../analytics/src/analytics/integrations/github.py)
- [GitHub CLI][github-cli]

Currently, we use a sub-process to invoke the [GitHub CLI][github-cli] to export data from GitHub. The reason we use the CLI instead of [PyGitHub][pygithub] or the GitHub GraphQL api is because the CLI has a dedicated set of [commands for GitHub projects][github-project-commands].

We *may* reopen that decision if GitHub adds a project-specific endpoint to their REST API, or if we want to extract a more targeted subset of the project and issue data using the GraphQL API.

### Slack

- [Slack module](../../analytics/src/analytics/integrations/slack.py)
- [Slack python SDK]

We use [Slack's python SDK][slack-sdk] to post our the results of our analysis to Slack.

In order to get the permissions needed to post to a channel in Slack, we took the following steps:

1. We [created a custom Slack bot][slack-bot-tutorial] with the following permissions:
   - `channels:join` - Join public channels in a workspace
   - `channels:read` - View basic information about public channels in a workspace
   - `chat:write` - Send messages as the bot
   - `files:write` - Upload, edit, and delete files as the bot
2. We installed the Slack bot in the Simpler.Grants.gov Slack workspace.
3. We added the Slack bot to the channel(s) where we wanted to post the analytics results.
4. We use the OAuth token for the workspace to authenticate and post results to those channels each time the analytics pipeline is run.

## Orchestration

- [Run analytics GitHub action](../../.github/workflows/run-analytics.yml)
- [GitHub actions quickstart][github-action-quickstart]
- [GitHub actions triggers][github-action-triggers]

Currently, we run the analytics pipeline by invoking the `analytics` CLI using a GitHub action that supports two triggers:

- [`schedule`][github-schedule-trigger] - Enables scheduled runs of the GitHub action using a cron-like format
- [`repository_dispatch`][github-dispatch-trigger] - Enables project maintainers to trigger the GitHub action from the "Actions" tab in GitHub.

<!-- Key technologies -->
[pandas-docs]: https://pandas.pydata.org/docs/index.html
[pandas-source]: https://github.com/pandas-dev/pandas
[plotly-docs]: https://plotly.com/python/
[plotly-source]: https://github.com/plotly/plotly.py
[typer-docs]: https://typer.tiangolo.com/
[typer-source]: https://github.com/tiangolo/typer
[dynaconf-docs]: https://www.dynaconf.com/
[dynaconf-source]: https://github.com/dynaconf/dynaconf
<!-- GitHub links -->
[github-cli]: https://cli.github.com/
[github-project-commands]: https://cli.github.com/manual/gh_project
[pygithub]: https://pygithub.readthedocs.io/en/stable/introduction.html
[github-action-triggers]: https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows
[github-schedule-trigger]: https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule
[github-dispatch-trigger]: https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#repository_dispatch
[github-action-quickstart]: https://docs.github.com/en/actions/quickstart
<!-- Slack -->
[slack-bot-tutorial]: https://medium.com/applied-data-science/how-to-build-you-own-slack-bot-714283fd16e5
[slack-sdk]: https://slack.dev/python-slack-sdk/
