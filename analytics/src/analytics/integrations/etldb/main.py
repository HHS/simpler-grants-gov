"""Integrate with database to read and write etl data."""

from pathlib import Path

from sqlalchemy import text

from analytics.datasets.etl_dataset import EtlDataset, EtlEntityType
from analytics.integrations.etldb.deliverable_model import EtlDeliverableModel
from analytics.integrations.etldb.epic_model import EtlEpicModel
from analytics.integrations.etldb.etldb import EtlDb
from analytics.integrations.etldb.issue_model import EtlIssueModel
from analytics.integrations.etldb.quad_model import EtlQuadModel
from analytics.integrations.etldb.sprint_model import EtlSprintModel

VERBOSE = False


def init_db() -> None:
    """Initialize etl database."""
    # define the path to the sql file
    parent_path = Path(__file__).resolve().parent
    sql_path = f"{parent_path}/create_etl_db.sql"

    # read sql file
    with open(sql_path) as f:
        sql = f.read()

    # execute sql
    try:
        db = EtlDb()
        cursor = db.connection()
        cursor.execute(
            text(sql),
        )
        db.commit(cursor)
    except RuntimeError as e:
        message = f"Failed to initialize db: {e}"
        raise RuntimeError(message) from e


def sync_db(dataset: EtlDataset, effective: str) -> None:
    """Write github data to etl database."""
    # initialize a map of github id to db row id
    ghid_map: dict[EtlEntityType, dict[str, int]] = {
        EtlEntityType.DELIVERABLE: {},
        EtlEntityType.EPIC: {},
        EtlEntityType.SPRINT: {},
        EtlEntityType.QUAD: {},
    }

    # initialize db connection
    db = EtlDb(effective)

    # sync quad data to db resulting in row id for each quad
    try:
        ghid_map[EtlEntityType.QUAD] = sync_quads(db, dataset)
        print(f"quad row(s) processed: {len(ghid_map[EtlEntityType.QUAD])}")
    except RuntimeError as e:
        message = f"Failed to sync quad data: {e}"
        raise RuntimeError(message) from e

    # sync deliverable data to db resulting in row id for each deliverable
    try:
        ghid_map[EtlEntityType.DELIVERABLE] = sync_deliverables(
            db,
            dataset,
            ghid_map,
        )
        print(
            f"deliverable row(s) processed: {len(ghid_map[EtlEntityType.DELIVERABLE])}",
        )
    except RuntimeError as e:
        message = f"Failed to sync deliverable data: {e}"
        raise RuntimeError(message) from e

    # sync sprint data to db resulting in row id for each sprint
    try:
        ghid_map[EtlEntityType.SPRINT] = sync_sprints(db, dataset, ghid_map)
        print(f"sprint row(s) processed: {len(ghid_map[EtlEntityType.SPRINT])}")
    except RuntimeError as e:
        message = f"Failed to sync sprint data: {e}"
        raise RuntimeError(message) from e

    # sync epic data to db resulting in row id for each epic
    try:
        ghid_map[EtlEntityType.EPIC] = sync_epics(db, dataset, ghid_map)
        print(f"epic row(s) processed: {len(ghid_map[EtlEntityType.EPIC])}")
    except RuntimeError as e:
        message = f"Failed to sync epic data: {e}"
        raise RuntimeError(message) from e

    # sync issue data to db resulting in row id for each issue
    try:
        issue_map = sync_issues(db, dataset, ghid_map)
        print(f"issue row(s) processed: {len(issue_map)}")
    except RuntimeError as e:
        message = f"Failed to sync issue data: {e}"
        raise RuntimeError(message) from e


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
