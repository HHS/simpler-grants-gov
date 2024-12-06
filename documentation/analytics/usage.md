# Common use cases

The following sections describe some common ways to interact with the analytics package and the reports it produces.

## View daily reports in Slack

We have some automation set up in this repository that automatically runs our analytics and posts the results to Slack on a daily basis. To see these results, use the following steps to discover and join the `#z_bot-sprint-reporting` channel for updates.

1. Join our Slack workspace. **Note:** This option will be available for open source contributors shortly.
2. Within Slack, click the "Channels" dropdown menu, then select "Manage > Browse channels".
   <img alt="Screenshot of browsing channels in slack" src="../../analytics/static/screenshot-browse-channels-slack.png" width=500>
3. On the browse channel page, search for `#z_bot-sprint-reporting` and select it from the list of results.
4. On the channel page, select "Join channel" at the bottom of the page.

## Trigger a report from the command line

> [!NOTE]
> The following sections require you to have the tool running locally. For more information about how to install and run the analytics package, visit our [development guide](development.md).

If you want to have more control over how the reports are run, you can also run the reports locally from the command line. In most cases, the reports you'd like to run are already available as `make` commands, specified in our [`Makefile`](./Makefile)

### Export data and run reports

If want to run reports with the most recent data from GitHub, the easiest way to do it is to run `make sprint-reports-with-latest-data`.

That should result in something like the following being logged to the command line:

<img alt="Screenshot of terminal after running make sprint-reports-with-latest-data" src="../../analytics/static/screenshot-make-sprint-reports.png" width=750>

It should also open two new browser tabs, each with a separate report:

**Sprint burndown by points for the current sprint**

![Screenshot of burndown for sprint 10](../../analytics/static/screenshot-sprint-burndown.png)

**Percent of points complete by deliverable**

![Screenshot of deliverable percent complete by points](../../analytics/static/screenshot-deliverable-pct-complete-points.png)

### Other relevant make commands

- `make issue-data-export` - Exports issue data from HHS/simpler-grants-gov
- `make sprint-data-export` - Exports project data from the [Sprint Planning GitHub project](https://github.com/orgs/HHS/projects/13)
- `make gh-data-export` - Exports both issue and sprint data
- `make sprint-burndown` - Runs the sprint burndown report
- `make percent-complete` - Runs the percent complete by deliverable report
- `make sprint-reports` - Runs both percent complete and sprint burndown (without exporting data first)
- `make gh-db-data-import` - Imports issue and sprint data to the analytics database

## Using the command line interface

> [!NOTE]
> The following sections require you to have the tool running locally. For more information about how to install and run the analytics package, visit our [development guide](development.md).

For a bit more control over the underlying analytics package, you can use the *full* `analytics` command line interface. The following sections describe how to work with the analytics CLI.

### Learning how to use the command line tool

The `analytics` package comes with a built-in CLI that you can use to discover the reporting features available:

Start by simply typing `poetry run analytics --help` which will print out a list of available commands:

![Screenshot of passing the --help flag to CLI entry point](../../analytics/static/screenshot-cli-help.png)

Discover the arguments required for a particular command by appending the `--help` flag to that command:

```bash
poetry run analytics export gh_issue_data --help
```

![Screenshot of passing the --help flag to a specific command](../../analytics/static/screenshot-command-help.png)

### Exporting GitHub data

After following the installation steps above, you can use the following commands to export data from GitHub for local analysis:

You can use the following command to import data to the analytics database.

```bash 
poetry run analytics export gh_delivery_data \
	--config-file config/github-projects.json \
	--output-file  data/delivery-data.json \
	--temp-dir data
```

or the simpler

```bash
make gh-data-export
```

A couple of notes about this command:
- `--config-file` refers to the configuration file which contains details about the GitHub projects to export data from.
- When running the export command via `make` this flag is pre-populated with the path to the version-controlled config file.

### Working with the Analytics database

The following sections assume that the steps in our [development guide](development.md) have been completed first. This is especially helpful when seeding the database for local testing and development. Additionally, you will need to have [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed.

#### Importing Github data

You can use the following command to import data to the analytics database.

```bash
poetry run analytics import db_import --delivery-file data/delivery-data.json
```
or the simpler:

```bash
make gh-data-db-import
```

Some notes about this command:
- `--delivery-file` refers to the file generated by the `poetry run export gh_delivery_data ` command.
- When running the import command via `make` this flag is pre-populated with the relative paths: `data/delivery-data.json`.

The data from this command can be found in the `github_project_data` table.

#### Viewing the data in the Terminal

The database can be accessed locally by running the command `docker-compose up -d`. This will start the docker containers for Metabase and the analytics database in a detatched state.

In Docker desktop, navigate to the analytics database container and sign into the database `psql -U <database-user>`. From here, you can run SQL queries to view data.

When finished, run `docker-compose down` to stop and remove all containers, networks and volumes associated with the analytics application.

#### Viewing the data in Metabase

[Metabase](https://www.metabase.com/) is a business intelligence that lets you query, organize and view data with a friendly UX. In order to view data in Metabase, start the containers via `make build`,  and then navigate to http://localhost:3100/.

The first time you access Metabase you will be guided through a small setup process to sync the database to the platform. See local.env to set database properties.

![Screenshot of the landing page in Metabase](../../analytics/static/screenshot-metabase-page.png)
![Screenshot of the analytics db configuration](../../analytics/static/screenshot-metabase-db-config.png)
![Screenshot of a row of test data](../../analytics/static/screenshot-metabase-row-data.png)

### Calculating metrics

#### Calculating sprint burndown

Once you've exported the sprint and issue data from GitHub, you can start calculating metrics. We'll begin with sprint burndown:

```bash
poetry run analytics calculate sprint_burndown \
  --issue-file data/delivery-data.json \
  --sprint "@current" \
  --owner HHS \
  --project 13 \
  --unit points \
  --show-results
```

or the simpler:

```bash
make sprint-burndown
```

A couple of important notes about this command:

- `--issue-file data/delivery-data.json` refers to the output of `poetry run export gh_delivery_data` which exports issue and sprint data from GitHub
- `--sprint @current` In order to calculate burndown, you'll need to specify either `"@current"` for the current sprint or the name of another sprint, e.g. `"Sprint 10"`
- `--owner HHS` and `--project 13` You can also specify which GitHub project owner and number you want to calculate burndown for, the default is `HHS` and `13` respectively.
- `--unit points` In order to calculate burndown based on story points, you pass `points` to the `--unit` option. The other option for unit is `issues`
- `--show-results` In order to the see the output in a browser you'll need to pass this flag.

![Screenshot of burndown for sprint 10](../../analytics/static/screenshot-sprint-burndown.png)

You can also post the results of this metric to a Slack channel:

> [!NOTE] You must have the following environment variables set to post to Slack:
> - `ANALYTICS_SLACK_BOT_TOKEN` the OAuth token for a slackbot installed in your workspace
> - `ANALYTICS_REPORTING_CHANNEL_ID` the id of the channel you want to post to in Slack.
>
> For more information about setting up these variables see the [installation guide](development.md#configuring-secrets)

```bash
poetry run analytics calculate sprint_burndown \
  --issue-file data/delivery-data.json \
  --sprint "@current" \
  --unit points \
  --post-results
```

### Calculating deliverable percent complete

Another key metric you can report is the percentage of issues or points completed per 30k deliverable.
You can specify the unit you want to use for percent complete (e.g. points or issues) using the `--unit` flag.

For example, here we're calculating percentage completion based on the number of tickets under each deliverable.

```bash
poetry run analytics calculate deliverable_percent_complete \
  --issue-file data/delivery-data.json \
  --show-results \
  --unit issues
```
![Screenshot of deliverable percent complete by issues](../../analytics/static/screenshot-deliverable-pct-complete-tasks.png)

And here we're calculating it based on the total story point value of those tickets.

```bash
poetry run analytics calculate deliverable_percent_complete \
  --issue-file data/delivery-data.json \
  --show-results \
  --unit points
```

![Screenshot of deliverable percent complete by points](../../analytics/static/screenshot-deliverable-pct-complete-points.png)

The `deliverable_pct_complete` sub-command also supports the `--post-results` flag if you want to post this data to slack.


You can also pass the `--include-status` flag to limit the percent complete report to deliverables with specific statuses. It can be passed multiple times to include multiple statuses.

Here's an example of how to use these in practice:

```bash
poetry run analytics calculate deliverable_percent_complete \
  --issue-file data/delivery-data.json \
  --include-status "In Progress" \
  --include-status "Planning" \
  --show-results \
  --unit points
```

### Extract and Load 

Development is underway on new as-is/as-was reporting capabilities, the foundation of which is an extract-and-load workflow that writes to an ETL DB.

Initialize the ETL DB:
```bash
poetry run analytics etl db_migrate
```

Transform and load a json file into the ETL DB:
```bash
poetry run analytics etl transform_and_load --issue-file ./data/test-etl-01.json --effective-date 2024-10-28 
```
