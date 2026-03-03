import pytest
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.constants.static_role_values import OPPORTUNITY_PUBLISHER
from src.db.models.user_models import AgencyUser, User
from src.task.agencies.setup_lower_env_agencies import SetupLowerEnvAgenciesTask


def test_setup_lower_env_agencies(enable_factory_create, db_session):
    task = SetupLowerEnvAgenciesTask(db_session)
    task.run()

    # Get all users
    users = (
        db_session.execute(
            select(User).options(selectinload(User.agency_users).selectinload(AgencyUser.agency))
        )
        .scalars()
        .all()
    )

    # Check each user for a fake agency with the opportunity_publisher role
    test_success = True

    for user in users:
        agency_and_role_found = False

        # For each agency that this user belongs to, check for the AUTO prefix
        for agency_user in user.agency_users:
            agency = agency_user.agency
            if agency.agency_code.startswith("AUTO"):

                # Fake agency found; check for the user role
                for agency_user_role in agency_user.agency_user_roles:
                    if agency_user_role.role_id == OPPORTUNITY_PUBLISHER.role_id:
                        agency_and_role_found = True
                        break

        # For this user, if no fake agency or user role found then stop and fail the test
        if not agency_and_role_found:
            test_success = False
            break

    # If all users were checked successfully, this will assert True
    assert test_success


def test_does_not_work_in_prod(db_session, monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "prod")
    with pytest.raises(Exception, match="ENVIRONMENT must be local, dev or staging"):
        SetupLowerEnvAgenciesTask(db_session).run()
