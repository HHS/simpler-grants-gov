# Simpler Grants Analytics

This sub-directory enables users to run analytics on data generated within the Simpler Grants project.

## Getting Started

### Pre-requisites

- Python version 3.11
- Poetry
- GitHub CLI

Check that you have the following with: `make check-prereqs`

### Installation

1. Clone the GitHub repo: `git clone https://github.com/HHS/simpler-grants-gov.git`
2. Change directory into the analytics folder: `cd simpler-grants-gov/analytics`
4. Set up the project: `make setup` -- This will install the required packages and prompt you to authenticate with GitHub
5. Create a `.secrets.toml` with the following details, see the next section to discover where these values can be found:
   ```toml
   reporting_channel_id = "<REPLACE_WITH_CHANNEL_ID>"
   slack_bot_token = "<REPLACE_WITH_SLACKBOT_TOKEN_ID>"
   ```

### Configuring secrets

#### Prerequisites

In order to correctly set the value of the `slack_bot_token` and `reporting_channel_id` you will need:

1. To be a member of the Simpler.Grants.gov slack workspace
2. To be a collaborator on the Sprint Reporting Bot slack app

If you need to be added to the slack workspace or to the list of collaborators for the app, contact a project maintainer.

#### Finding reporting channel ID

1. Go to the `#z_bot-sprint-reporting` channel in the Simpler.Grants.gov slack workspace.
2. Click on the name of the channel in the top left part of the screen.
3. Scroll down to the bottom of the resulting dialog box until you see where it says `Channel ID`.
4. Copy and paste that ID into your `.secrets.toml` file under the `reporting_channel_id` variable.

<img alt="Screenshot of dialog box with channel ID" src="./static/screenshot-channel-id.png" height=500>

#### Finding slackbot token

1. Go to [the dashboard](https://api.slack.com/apps) that displays the slack apps for which you have collaborator access
2. Click on `Sprint Reporting Bot` to go to the settings for our analytics slackbot
3. From the side menu, select `OAuth & Permissions` and scroll down to the "OAuth tokens for your workspace" section
4. Copy the "Bot user OAuth token" which should start with `xoxb` and paste it into your `.secrets.toml` file under the `slack_bot_token` variable.

<img alt="Screenshot of slack app settings page with bot user OAuth token" src="./static/screenshot-slackbot-token.png" width=900>

## Getting started

### Learning how to use the command line tool

The `analytics` package comes with a built-in CLI that you can use to discover the reporting features available:

Start by simply typing `poetry run analytics --help` which will print out a list of available commands:

![Screenshot of passing the --help flag to CLI entry point](static/screenshot-cli-help.png)

Discover the arguments required for a particular command by appending the `--help` flag to that command:

```bash
poetry run analytics export gh_issue_data --help
```

![Screenshot of passing the --help flag to a specific command](static/screenshot-command-help.png)

### Exporting GitHub data

After following the installation steps above, you can use the following commands to export data from GitHub for local analysis:

#### Exporting issue data

```bash
poetry run analytics export gh_issue_data --owner HHS --repo simpler-grants-gov --output-file data/issue-data.json
```

Let's break this down piece by piece:

- `poetry run` - Tells poetry to execute a package installed in the virtual environment
- `analytics` - The name of the analytics package installed locally
- `export gh_issue_data` - The specific sub-command in the analytics CLI we want to run
- `--owner HHS` Passing `HHS` to the `--owner` argument for this sub-command, the owner of the repo whose issue data we want to export, in this case `HHS`
- `--repo simpler-grants-gov` We want to export issue data from the `simpler-grants-gov` repo owned by `HHS`
- `--output-file data/issue-data.json` We want to write the exported data to the file with the relative path `data/issue-data.json`

#### Exporting project data

Exporting project data works almost the same way, except it expects a `--project` argument instead of a `--repo` argument. **NOTE:** The project should be the project number as it appears in the URL, not the name of the project.

```bash
poetry run analytics export gh_project_data --owner HHS --project 13 --output-file data/sprint-data.json
```

### Calculating metrics

#### Calculating sprint burndown

Once you've exported the sprint and issue data from GitHub, you can start calculating metrics. We'll begin with sprint burndown:

```bash
poetry run analytics calculate sprint_burndown --sprint-file data/sprint-data.json --issue-file data/issue-data.json --sprint @current --unit points --show-results
```

A couple of important notes about this command:

- `--sprint @current` In order to calculate burndown, you'll need to specify either `@current` for the current sprint or the name of another sprint, e.g. `"Sprint 10"`
- `--unit points` In order to calculate burndown based on story points, you pass `points` to the `--unit` option. The other option for unit is `tasks`
- `--show-results` In order to the see the output in a browser you'll need to pass this flag.

![Screenshot of burndown for sprint 10](static/reporting-notebook-screenshot.png)

You can also post the results of this metric to a Slack channel:

```bash
poetry run analytics calculate sprint_burndown --sprint-file data/sprint-data.json --issue-file data/issue-data.json --sprint "Sprint 10" --unit points --post-results
```

> **NOTE:** This requires you to have the `.secrets.toml` configured according to the directions in step 5 of the [installation section](#installation)

![Screenshot of burndown report in slack](static/screenshot-slack-burndown.png)

### Calculating deliverable percent complete

Another key metric you can report is the percentage of tasks or points completed per 30k deliverable.
You can specify the unit you want to use for percent complete (e.g. points or tasks) using the `--unit` flag.

For example, here we're calculating percentage completion based on the number of tickets under each deliverable.

```bash
poetry run analytics calculate deliverable_percent_complete --sprint-file data/sprint-data.json --issue-file data/issue-data.json --show-results --unit tasks
```
![Screenshot of deliverable percent complete by tasks](static/screenshot-deliverable-pct-complete-tasks.png)

And here we're calculating it based on the total story point value of those tickets.

```bash
poetry run analytics calculate deliverable_percent_complete --sprint-file data/sprint-data.json --issue-file data/issue-data.json --show-results --unit points
```

![Screenshot of deliverable percent complete by tasks](static/screenshot-deliverable-pct-complete-points.png)

The `deliverable_pct_complete` sub-command also supports the `--post-results` flag if you want to post this data to slack.
