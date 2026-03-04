import pytest
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.constants.static_role_values import OPPORTUNITY_PUBLISHER
from src.db.models.user_models import AgencyUser, User, UserType
from src.task.agencies.setup_lower_env_agencies import SetupLowerEnvAgenciesTask
from tests.src.db.models.factories import UserFactory


def test_setup_lower_env_agencies(enable_factory_create, db_session):

    # Create a few users
    users = UserFactory.create_batch(size=5)
    user_ids = [user.user_id for user in users]

    # Run the task
    task = SetupLowerEnvAgenciesTask(db_session)
    task.run()

    # Get the user records (use expire_all to force load from the DB)
    db_session.expire_all()
    users = (
        db_session.execute(
            select(User)
            .options(selectinload(User.agency_users).selectinload(AgencyUser.agency))
            .where(User.user_type == UserType.STANDARD)
            .where(User.user_id.in_(user_ids))
        )
        .scalars()
        .all()
    )
    assert len(users) >= 5

    # --- Test1: Check each user for a fake agency with the opportunity_publisher role ---
    errors = []
    for user in users:
        assert len(user.agency_users) >= 1

        # For each agency that this user belongs to, check for the AUTO prefix
        agency_and_role_found = False
        for agency_user in user.agency_users:
            agency = agency_user.agency
            if agency.agency_code.startswith("AUTO"):

                # Fake agency found; check for the user role
                for agency_user_role in agency_user.agency_user_roles:
                    if agency_user_role.role_id == OPPORTUNITY_PUBLISHER.role_id:
                        agency_and_role_found = True
                        break

        # For this user, if no fake agency or user role was found
        if not agency_and_role_found:
            errors.append(
                "User does not have a fake agency and/or a role; user_id = " + str(user.user_id)
            )

    # Assert that all users were checked successfully
    assert len(errors) == 0, ". ".join(errors)

    # --- Test 2: Rerun the task and verify it doesn't give the users a second agency ---
    task = SetupLowerEnvAgenciesTask(db_session)
    task.run()

    # Again, expire_all and get the user records
    db_session.expire_all()
    users = (
        db_session.execute(
            select(User)
            .options(selectinload(User.agency_users).selectinload(AgencyUser.agency))
            .where(User.user_type == UserType.STANDARD)
            .where(User.user_id.in_(user_ids))
        )
        .scalars()
        .all()
    )
    assert len(users) >= 5

    errors2 = []
    for user in users:
        agency_count = 0
        for agency_user in user.agency_users:
            agency = agency_user.agency
            if agency.agency_code.startswith("AUTO"):
                agency_count += 1

        if agency_count != 1:
            errors2.append("User has more than 1 fake agency; user_id = " + str(user.user_id))

    # Assert that all users have no more than 1 fake agency
    assert len(errors2) == 0, ". ".join(errors2)


def test_does_not_work_in_prod(db_session, monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "prod")
    with pytest.raises(Exception, match="ENVIRONMENT must be local, dev or staging"):
        SetupLowerEnvAgenciesTask(db_session).run()
