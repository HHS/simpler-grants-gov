"""Integrate with database to read and write etl data."""

from pathlib import Path
from sqlalchemy import text
from analytics.datasets.etl_dataset import EtlDataset
from analytics.datasets.etl_dataset import EtlEntityType as entity
from analytics.integrations.etldb.etldb import EtlDb
from analytics.integrations.etldb.deliverable_model import EtlDeliverableModel
from analytics.integrations.etldb.epic_model import EtlEpicModel
from analytics.integrations.etldb.issue_model import EtlIssueModel
from analytics.integrations.etldb.sprint_model import EtlSprintModel
from analytics.integrations.etldb.quad_model import EtlQuadModel

DEBUG = False

def init_db() -> None:
    """Initialize etl database"""

    # define the path to the sql file
    parent_path = Path(__file__).resolve().parent
    sql_path = f"{parent_path}/create_etl_db.sql"

    # read sql file
    with open(sql_path) as f:
        sql = f.read()

    # execute sql
    db = EtlDb(None)
    cursor = db.connection()
    cursor.execute(text(sql),)
    db.commit(cursor)


def sync_db(dataset: EtlDataset, effective: str) -> None:
    """Write github data to etl database"""
    # initialize a map of github id to db row id
    ghid_map = {
        entity.DELIVERABLE: {},
        entity.EPIC: {},
        entity.SPRINT: {},
        entity.QUAD: {}
    }

    # sync quad data to db resulting in row id for each quad
    ghid_map[entity.QUAD] = sync_quads(dataset, effective)
    print(f"quad row(s) processed: {len(ghid_map[entity.QUAD])}")

    # sync deliverable data to db resulting in row id for each deliverable
    ghid_map[entity.DELIVERABLE] = sync_deliverables(dataset, effective, ghid_map)
    print(f"deliverable row(s) processed: {len(ghid_map[entity.DELIVERABLE])}")

    # sync sprint data to db resulting in row id for each sprint
    ghid_map[entity.SPRINT] = sync_sprints(dataset, effective, ghid_map)
    print(f"sprint row(s) processed: {len(ghid_map[entity.SPRINT])}")

    # sync epic data to db resulting in row id for each epic
    ghid_map[entity.EPIC] = sync_epics(dataset, effective, ghid_map)
    print(f"epic row(s) processed: {len(ghid_map[entity.EPIC])}")

    # sync issue data to db resulting in row id for each issue
    issue_map = sync_issues(dataset, effective, ghid_map)
    print(f"issue row(s) processed: {len(issue_map)}")


def sync_deliverables(dataset: EtlDataset, effective: str, ghid_map: dict) -> dict:
    """Insert or update (if necessary) a row for each deliverable and return a map of row ids"""
    result = {}
    db = EtlDeliverableModel(effective)
    for ghid in dataset.get_deliverable_ghids():
        deliverable_df = dataset.get_deliverable(ghid)
        result[ghid], _ = db.sync_deliverable(deliverable_df, ghid_map)
        if DEBUG:
            print(f"DELIVERABLE '{ghid}' row_id = {result[ghid]}")
    return result


def sync_epics(dataset: EtlDataset, effective: str, ghid_map: dict) -> dict:
    """Insert or update (if necessary) a row for each epic and return a map of row ids"""
    result = {}
    db = EtlEpicModel(effective)
    for ghid in dataset.get_epic_ghids():
        epic_df = dataset.get_epic(ghid)
        result[ghid], _ = db.sync_epic(epic_df, ghid_map)
        if DEBUG:
            print(f"EPIC '{ghid}' row_id = {result[ghid]}")
    return result


def sync_issues(dataset: EtlDataset, effective: str, ghid_map: dict) -> dict:
    """Insert or update (if necessary) a row for each issue and return a map of row ids"""
    result = {}
    db = EtlIssueModel(effective)
    for ghid in dataset.get_issue_ghids():
        issue_df = dataset.get_issue(ghid)
        result[ghid], _ = db.sync_issue(issue_df, ghid_map)
        if DEBUG:
            print(f"ISSUE '{ghid}' issue_id = {result[ghid]}")
    return result


def sync_sprints(dataset: EtlDataset, effective: str, ghid_map: dict) -> dict:
    """Insert or update (if necessary) a row for each sprint and return a map of row ids"""
    result = {}
    db = EtlSprintModel(effective)
    for ghid in dataset.get_sprint_ghids():
        sprint_df = dataset.get_sprint(ghid)
        result[ghid], _ = db.sync_sprint(sprint_df, ghid_map)
        if DEBUG:
            print(f"SPRINT '{ghid}' row_id = {result[ghid]}")
    return result


def sync_quads(dataset: EtlDataset, effective: str) -> dict:
    """Insert or update (if necessary) a row for each quad and return a map of row ids"""
    result = {}
    db = EtlQuadModel(effective)
    for ghid in dataset.get_quad_ghids():
        quad_df = dataset.get_quad(ghid)
        result[ghid], _ = db.sync_quad(quad_df)
        if DEBUG:
            print(f"QUAD '{ghid}' title = '{quad_df['quad_name']}', row_id = {result[ghid]}")
    return result
