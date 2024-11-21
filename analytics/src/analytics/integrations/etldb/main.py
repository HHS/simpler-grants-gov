"""Integrate with database to read and write etl data."""

import os
import re
from pathlib import Path

from sqlalchemy import text

from analytics.datasets.etl_dataset import EtlDataset, EtlEntityType
from analytics.integrations.etldb.deliverable_model import EtlDeliverableModel
from analytics.integrations.etldb.epic_model import EtlEpicModel
from analytics.integrations.etldb.etldb import EtlDb
from analytics.integrations.etldb.issue_model import EtlIssueModel
from analytics.integrations.etldb.project_model import EtlProjectModel
from analytics.integrations.etldb.quad_model import EtlQuadModel
from analytics.integrations.etldb.sprint_model import EtlSprintModel

VERBOSE = False


def db_migrate() -> None:
    """
    Create and/or update an etl database by applying a sequential set of migration scripts.

    It applies the migrations using the following steps:
    - Check the current schema version listed in the database
    - Retrieve the list of migration scripts ordered by version
    - If the current schema version is less than the version of the latest migration script
      run the remaining migrations in order
    - Bump the schema version in the database to the latest version
    - If the current schema version matches the latest script, do nothing
    """
    # get connection to database
    etldb = EtlDb()
    current_version = etldb.get_schema_version()
    print(f"current schema version: {current_version}")

    # get all sql file paths and respective version numbers
    sql_file_path_map = get_sql_file_paths()
    all_versions = sorted(sql_file_path_map.keys())

    # iterate sql files
    migration_count = 0
    for next_version in all_versions:
        if next_version <= current_version:
            continue
        # read sql file
        with open(sql_file_path_map[next_version]) as f:
            sql = f.read()
            # execute sql
            print(f"applying migration for schema version: {next_version}")
            print(f"migration source file: {sql_file_path_map[next_version]}")
            cursor = etldb.connection()
            cursor.execute(
                text(sql),
            )
            # commit changes
            etldb.commit(cursor)
            # bump schema version number
            _ = etldb.set_schema_version(next_version)
            current_version = next_version
            migration_count += 1

    # summarize results in output
    print(f"total migrations applied: {migration_count}")
    print(f"new schema version: {current_version}")


def sync_data(dataset: EtlDataset, effective: str) -> None:
    """Write github data to etl database."""
    # initialize a map of github id to db row id
    ghid_map: dict[EtlEntityType, dict[str, int]] = {
        EtlEntityType.DELIVERABLE: {},
        EtlEntityType.EPIC: {},
        EtlEntityType.PROJECT: {},
        EtlEntityType.QUAD: {},
        EtlEntityType.SPRINT: {},
    }

    # initialize db connection
    db = EtlDb(effective)

    # note: the following code assumes SCHEMA VERSION >= 4
    # sync project data to db resulting in row id for each project
    ghid_map[EtlEntityType.PROJECT] = sync_projects(db, dataset)
    print(f"project row(s) processed: {len(ghid_map[EtlEntityType.PROJECT])}")

    # sync quad data to db resulting in row id for each quad
    ghid_map[EtlEntityType.QUAD] = sync_quads(db, dataset)
    print(f"quad row(s) processed: {len(ghid_map[EtlEntityType.QUAD])}")

    # sync deliverable data to db resulting in row id for each deliverable
    ghid_map[EtlEntityType.DELIVERABLE] = sync_deliverables(
        db,
        dataset,
        ghid_map,
    )
    print(
        f"deliverable row(s) processed: {len(ghid_map[EtlEntityType.DELIVERABLE])}",
    )

    # sync sprint data to db resulting in row id for each sprint
    ghid_map[EtlEntityType.SPRINT] = sync_sprints(db, dataset, ghid_map)
    print(f"sprint row(s) processed: {len(ghid_map[EtlEntityType.SPRINT])}")

    # sync epic data to db resulting in row id for each epic
    ghid_map[EtlEntityType.EPIC] = sync_epics(db, dataset, ghid_map)
    print(f"epic row(s) processed: {len(ghid_map[EtlEntityType.EPIC])}")

    # sync issue data to db resulting in row id for each issue
    issue_map = sync_issues(db, dataset, ghid_map)
    print(f"issue row(s) processed: {len(issue_map)}")


def sync_deliverables(db: EtlDb, dataset: EtlDataset, ghid_map: dict) -> dict:
    """Insert or update (if necessary) a row for each deliverable and return a map of row ids."""
    result = {}
    model = EtlDeliverableModel(db)
    for ghid in dataset.get_deliverable_ghids():
        deliverable_df = dataset.get_deliverable(ghid)
        result[ghid], _ = model.sync_deliverable(deliverable_df, ghid_map)
        if VERBOSE:
            print(f"DELIVERABLE '{ghid}' row_id = {result[ghid]}")
    return result


def sync_epics(db: EtlDb, dataset: EtlDataset, ghid_map: dict) -> dict:
    """Insert or update (if necessary) a row for each epic and return a map of row ids."""
    result = {}
    model = EtlEpicModel(db)
    for ghid in dataset.get_epic_ghids():
        epic_df = dataset.get_epic(ghid)
        result[ghid], _ = model.sync_epic(epic_df, ghid_map)
        if VERBOSE:
            print(f"EPIC '{ghid}' row_id = {result[ghid]}")
    return result


def sync_issues(db: EtlDb, dataset: EtlDataset, ghid_map: dict) -> dict:
    """Insert or update (if necessary) a row for each issue and return a map of row ids."""
    result = {}
    model = EtlIssueModel(db)
    for ghid in dataset.get_issue_ghids():
        issue_df = dataset.get_issue(ghid)
        result[ghid], _ = model.sync_issue(issue_df, ghid_map)
        if VERBOSE:
            print(f"ISSUE '{ghid}' issue_id = {result[ghid]}")
    return result


def sync_projects(db: EtlDb, dataset: EtlDataset) -> dict:
    """Insert or update (if necessary) a row for each project and return a map of row ids."""
    result = {}
    model = EtlProjectModel(db)
    for ghid in dataset.get_project_ghids():
        project_df = dataset.get_project(ghid)
        result[ghid], _ = model.sync_project(project_df)
        if VERBOSE:
            print(
                f"PROJECT '{ghid}' title = '{project_df['project_name']}', row_id = {result[ghid]}",
            )
    return result


def sync_sprints(db: EtlDb, dataset: EtlDataset, ghid_map: dict) -> dict:
    """Insert or update (if necessary) a row for each sprint and return a map of row ids."""
    result = {}
    model = EtlSprintModel(db)
    for ghid in dataset.get_sprint_ghids():
        sprint_df = dataset.get_sprint(ghid)
        result[ghid], _ = model.sync_sprint(sprint_df, ghid_map)
        if VERBOSE:
            print(f"SPRINT '{ghid}' row_id = {result[ghid]}")
    return result


def sync_quads(db: EtlDb, dataset: EtlDataset) -> dict:
    """Insert or update (if necessary) a row for each quad and return a map of row ids."""
    result = {}
    model = EtlQuadModel(db)
    for ghid in dataset.get_quad_ghids():
        quad_df = dataset.get_quad(ghid)
        result[ghid], _ = model.sync_quad(quad_df)
        if VERBOSE:
            print(
                f"QUAD '{ghid}' title = '{quad_df['quad_name']}', row_id = {result[ghid]}",
            )
    return result


def get_sql_file_paths() -> dict[int, str]:
    """Get all sql files needed for database initialization."""
    result = {}

    # define the path to the sql files
    sql_file_directory = f"{Path(__file__).resolve().parent}/migrations/versions"

    # get list of sorted filenames
    filename_list = sorted(os.listdir(sql_file_directory))

    # expected filename format: {4_digit_version_number}_{short_description}.sql
    # example: 0003_alter_tables_set_default_timestamp.sql
    pattern = re.compile(r"^\d\d\d\d_.+\.sql$")

    # compile dict of results
    for filename in filename_list:
        # validate filename format
        if not pattern.match(filename):
            message = f"FATAL: malformed db migration filename: {filename}"
            raise RuntimeError(message)

        # extrace version number from filename
        version = int(filename[:4])

        # do not allow duplicate version number
        if version in result:
            message = f"FATAL: Duplicate db migration version number: {version} "
            raise RuntimeError(message)

        # map the version number to the file path
        result[version] = f"{sql_file_directory}/{filename}"

    return result
