"""Integrate with database to read and write etl data."""

import random     # temporary hack
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
    """ Initialize etl database """

    # define the path to the sql file
    parent_path = Path(__file__).resolve().parent
    sql_path = "{}/create_etl_db.sql".format(parent_path)

    # read sql file
    with open(sql_path) as f:
        sql = f.read()

    # execute sql
    db = EtlDb(None)
    cursor = db.connection()
    result = cursor.execute(text(sql),)
    db.commit(cursor)

    return

def sync_db(dataset: EtlDataset, effective: str) -> None:

    # initialize a map of github id to db row id
    ghid_map = {
        entity.DELIVERABLE: {},
        entity.EPIC: {},
        entity.SPRINT: {},
        entity.QUAD: {}
    }

    # sync quad data to db resulting in row id for each quad
    ghid_map[entity.QUAD] = sync_quads(dataset, effective)
    print("quad row(s) processed: {}".format(len(ghid_map[entity.QUAD])))

    # sync deliverable data to db resulting in row id for each deliverable
    ghid_map[entity.DELIVERABLE] = sync_deliverables(dataset, effective, ghid_map)
    print("deliverable row(s) processed: {}".format(len(ghid_map[entity.DELIVERABLE])))

    # sync sprint data to db resulting in row id for each sprint
    ghid_map[entity.SPRINT] = sync_sprints(dataset, effective, ghid_map)
    print("sprint row(s) processed: {}".format(len(ghid_map[entity.SPRINT])))

    # sync epic data to db resulting in row id for each epic
    ghid_map[entity.EPIC] = sync_epics(dataset, effective, ghid_map)
    print("epic row(s) processed: {}".format(len(ghid_map[entity.EPIC])))

    # sync issue data to db resulting in row id for each issue
    issue_map = sync_issues(dataset, effective, ghid_map)
    print("issue row(s) processed: {}".format(len(issue_map)))

    return


def sync_deliverables(dataset: EtlDataset, effective: str, ghid_map: dict) -> dict:
    """ Insert or update (if necessary) a row for each deliverable and return a map of row ids """
    result = {}
    db = EtlDeliverableModel(effective)
    for ghid in dataset.get_deliverable_ghids():
        deliverable_df = dataset.get_deliverable(ghid)
        result[ghid], change_type = db.syncDeliverable(deliverable_df, ghid_map)
        if DEBUG:
            print("DELIVERABLE '{}' row_id = {}".format(str(ghid), result[ghid]))
    return result


def sync_epics(dataset: EtlDataset, effective: str, ghid_map: dict) -> dict:
    """ Insert or update (if necessary) a row for each epic and return a map of row ids """
    result = {}
    db = EtlEpicModel(effective)
    for ghid in dataset.get_epic_ghids():
        epic_df = dataset.get_epic(ghid)
        result[ghid], change_type = db.syncEpic(epic_df, ghid_map)
        if DEBUG:
            print("EPIC '{}' row_id = {}".format(str(ghid), result[ghid]))
    return result


def sync_issues(dataset: EtlDataset, effective: str, ghid_map: dict) -> dict:
    """ Insert or update (if necessary) a row for each issue and return a map of row ids """
    result = {}
    db = EtlIssueModel(effective)
    for ghid in dataset.get_issue_ghids():
        issue_df = dataset.get_issue(ghid)
        result[ghid], change_type = db.syncIssue(issue_df, ghid_map)
        if DEBUG:
            print("ISSUE '{}' issue_id = {}".format(str(ghid), result[ghid]))
    return result


def sync_sprints(dataset: EtlDataset, effective: str, ghid_map: dict) -> dict:
    """ Insert or update (if necessary) a row for each sprint and return a map of row ids """
    result = {}
    db = EtlSprintModel(effective)
    for ghid in dataset.get_sprint_ghids():
        sprint_df = dataset.get_sprint(ghid)
        result[ghid], change_type = db.syncSprint(sprint_df, ghid_map)
        if DEBUG:
            print("SPRINT '{}' row_id = {}".format(str(ghid), result[ghid]))
    return result


def sync_quads(dataset: EtlDataset, effective: str) -> dict:
    """ Insert or update (if necessary) a row for each quad and return a map of row ids """
    result = {}
    db = EtlQuadModel(effective)
    for ghid in dataset.get_quad_ghids():
        quad_df = dataset.get_quad(ghid)
        result[ghid], change_type = db.syncQuad(quad_df)
        if DEBUG:
            print("QUAD '{}' title = '{}', row_id = {}".format(str(ghid), quad_df['quad_name'], result[ghid]))
    return result
