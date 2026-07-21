import uuid

from sqlalchemy import select

from src.constants.lookup_constants import MgmtResourceType
from src.db.models.resource_models import (
    Department,
    MgmtInternalResource,
    MgmtResource,
    Subagency,
    Team,
)
from tests.db.models.factories import (
    DepartmentFactory,
    MgmtInternalResourceFactory,
    SubagencyFactory,
    TeamFactory,
)


def test_resource_automation_with_defaults(db_session):

    department = Department(department_name="My example department")
    db_session.add(department)

    subagency = Subagency(subagency_name="My example subagency", department=department)
    db_session.add(subagency)

    team = Team(team_name="My example team", subagency=subagency)
    db_session.add(team)

    internal_resource = MgmtInternalResource(internal_resource_name="My example internal resource")
    db_session.add(internal_resource)

    db_session.commit()

    assert department.department_id is not None
    assert department.resource.mgmt_resource_id == department.department_id
    assert department.resource.mgmt_resource_type == MgmtResourceType.DEPARTMENT

    assert subagency.subagency_id is not None
    assert subagency.resource.mgmt_resource_id == subagency.subagency_id
    assert subagency.resource.mgmt_resource_type == MgmtResourceType.SUBAGENCY

    assert team.team_id is not None
    assert team.resource.mgmt_resource_id == team.team_id
    assert team.resource.mgmt_resource_type == MgmtResourceType.TEAM

    assert internal_resource.mgmt_internal_resource_id is not None
    assert (
        internal_resource.resource.mgmt_resource_id == internal_resource.mgmt_internal_resource_id
    )
    assert internal_resource.resource.mgmt_resource_type == MgmtResourceType.INTERNAL


def test_resource_automation_with_set_ids(db_session):
    department = Department(department_id=uuid.uuid4(), department_name="My example department")
    db_session.add(department)

    subagency = Subagency(
        subagency_id=uuid.uuid4(), subagency_name="My example subagency", department=department
    )
    db_session.add(subagency)

    team = Team(team_id=uuid.uuid4(), team_name="My example team", subagency=subagency)
    db_session.add(team)

    internal_resource = MgmtInternalResource(
        mgmt_internal_resource_id=uuid.uuid4(),
        internal_resource_name="My example internal resource",
    )
    db_session.add(internal_resource)

    db_session.commit()

    assert department.department_id is not None
    assert department.resource.mgmt_resource_id == department.department_id
    assert department.resource.mgmt_resource_type == MgmtResourceType.DEPARTMENT

    assert subagency.subagency_id is not None
    assert subagency.resource.mgmt_resource_id == subagency.subagency_id
    assert subagency.resource.mgmt_resource_type == MgmtResourceType.SUBAGENCY

    assert team.team_id is not None
    assert team.resource.mgmt_resource_id == team.team_id
    assert team.resource.mgmt_resource_type == MgmtResourceType.TEAM

    assert internal_resource.mgmt_internal_resource_id is not None
    assert (
        internal_resource.resource.mgmt_resource_id == internal_resource.mgmt_internal_resource_id
    )
    assert internal_resource.resource.mgmt_resource_type == MgmtResourceType.INTERNAL


def test_resource_automation_does_not_change_resource_on_change(db_session, enable_factory_create):
    department_id = uuid.uuid4()
    department = DepartmentFactory.create(department_id=department_id)
    department.department_name = "New department name"

    subagency_id = uuid.uuid4()
    subagency = SubagencyFactory.create(subagency_id=subagency_id)
    subagency.subagency_name = "New subagency name"

    team_id = uuid.uuid4()
    team = TeamFactory.create(team_id=team_id)
    team.team_name = "New team name"

    internal_resource_id = uuid.uuid4()
    internal_resource = MgmtInternalResourceFactory.create(
        mgmt_internal_resource_id=internal_resource_id
    )
    internal_resource.internal_resource_name = "New internal resource name"

    db_session.commit()

    db_session.refresh(department)
    assert department.department_id == department_id
    assert department.resource.mgmt_resource_id == department_id
    assert department.department_name == "New department name"

    db_session.refresh(subagency)
    assert subagency.subagency_id == subagency_id
    assert subagency.resource.mgmt_resource_id == subagency_id
    assert subagency.subagency_name == "New subagency name"

    db_session.refresh(team)
    assert team.team_id == team_id
    assert team.resource.mgmt_resource_id == team_id
    assert team.team_id == team_id

    db_session.refresh(internal_resource)
    assert internal_resource.mgmt_internal_resource_id == internal_resource_id
    assert internal_resource.resource.mgmt_resource_id == internal_resource_id
    assert internal_resource.internal_resource_name == "New internal resource name"


def test_resource_automation_when_deleting_resource(db_session, enable_factory_create):
    department = DepartmentFactory.create()
    subagency = SubagencyFactory.create()
    team = TeamFactory.create()
    internal_resource = MgmtInternalResourceFactory.create()

    db_session.delete(department)
    db_session.delete(subagency)
    db_session.delete(team)
    db_session.delete(internal_resource)
    db_session.commit()

    resources = db_session.execute(
        select(MgmtResource).where(
            MgmtResource.mgmt_resource_id.in_(
                [
                    department.department_id,
                    subagency.subagency_id,
                    team.team_id,
                    internal_resource.mgmt_internal_resource_id,
                ]
            )
        )
    ).all()
    assert len(resources) == 0
