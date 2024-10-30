"""Integrate with database to read and write etl data."""

import random     # temporary hack
from pathlib import Path
from sqlalchemy import text
from analytics.datasets.etl_dataset import EtlDataset
from analytics.datasets.etl_dataset import EtlEntityType as entity
from analytics.integrations.etldb.etldb import EtlDb

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
    db = EtlDb()
    cursor = db.connection()
    result = cursor.execute(text(sql),)
    db.commit(cursor)

    return


def sync_deliverables(dataset: EtlDataset) -> dict:
    """ Insert or update (if necessary) a row for each deliverable and return a map of row ids """
    id_map = {}
    for ghid in dataset.get_deliverable_ghids():
        id_map[ghid] = random.randint(100, 999)   # TODO: get actual row id via insert or select
        if DEBUG:
            print("DELIVERABLE '{}' row_id = {}".format(str(ghid), id_map[ghid]))
    return id_map


def sync_epics(dataset: EtlDataset) -> dict:
    """ Insert or update (if necessary) a row for each epic and return a map of row ids """
    id_map = {}
    for ghid in dataset.get_epic_ghids():
        id_map[ghid] = random.randint(100, 999)   # TODO: get actual row id via insert or select
        if DEBUG:
            print("EPIC '{}' row_id = {}".format(str(ghid), id_map[ghid]))
    return id_map


def sync_issues(dataset: EtlDataset, id_map: dict) -> dict:
    """ Insert or update (if necessary) a row for each issue and return a map of row ids """
    issue_map = {}
    for ghid in dataset.get_issue_ghids():
        issue_df = dataset.get_issue(ghid)
        epic_id = id_map[entity.EPIC].get(issue_df['epic_ghid'])
        deliverable_id = id_map[entity.EPIC].get(issue_df['deliverable_ghid'])
        sprint_id = id_map[entity.SPRINT].get(issue_df['sprint_ghid'])
        quad_id = id_map[entity.QUAD].get(issue_df['quad_ghid'])
        row_id = random.randint(100, 999)   # TODO: get actual row id via insert or select
        issue_map[ghid] = row_id
        if DEBUG:
            print("ISSUE '{}' issue_id = {}, sprint_id = {}, epic_id = {}, ".format(str(ghid), row_id, sprint_id, epic_id))
    return issue_map


def sync_sprints(dataset: EtlDataset) -> dict:
    """ Insert or update (if necessary) a row for each sprint and return a map of row ids """
    id_map = {}
    for ghid in dataset.get_sprint_ghids():
        id_map[ghid] = random.randint(100, 999)   # TODO: get actual row id via insert or select
        if DEBUG:
            print("SPRINT '{}' row_id = {}".format(str(ghid), id_map[ghid]))
    return id_map


def sync_quads(dataset: EtlDataset) -> dict:
    """ Insert or update (if necessary) a row for each quad and return a map of row ids """
    id_map = {}
    for ghid in dataset.get_quad_ghids():
        id_map[ghid] = random.randint(100, 999)   # TODO: get actual row id via insert or select
        if DEBUG:
            quad_df = dataset.get_quad(ghid)
            print("QUAD '{}' title = '{}', row_id = {}".format(str(ghid), quad_df['quad_name'], id_map[ghid]))
    return id_map
