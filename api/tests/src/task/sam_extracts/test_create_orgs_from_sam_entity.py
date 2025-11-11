import pytest

from src.db.models.entity_models import SamGovEntity
from src.db.models.user_models import LinkExternalUser
from src.task.sam_extracts.create_orgs_from_sam_entity import CreateOrgsFromSamEntityTask
from tests.lib.db_testing import cascade_delete_from_db_table
from tests.src.db.models.factories import (
    LinkExternalUserFactory,
    OrganizationUserFactory,
    SamGovEntityFactory,
)


@pytest.fixture(autouse=True)
def cleanup_existing_entities(db_session):
    cascade_delete_from_db_table(db_session, SamGovEntity)
    cascade_delete_from_db_table(db_session, LinkExternalUser)


def test_run_task_multiple_entities_and_users_same_email(enable_factory_create, db_session):
    """Test that the query works as expected - if we setup the following
    entities, every combination of them will be added to each other.

    That is, if a user is is the EBIZ POC of multiple entities, they
    should be made the owner of all of those.
    """
    # It's not really realistic that multiple users have the same email address
    # but if they did, verify it works this way.
    user_a = LinkExternalUserFactory.create(email="mymail@mail.com")
    user_b = LinkExternalUserFactory.create(email="mymail@mail.com")
    user_c = LinkExternalUserFactory.create(email="mymail@mail.com")

    entity_a = SamGovEntityFactory.create(ebiz_poc_email="mymail@mail.com")
    entity_b = SamGovEntityFactory.create(ebiz_poc_email="mymail@mail.com")
    entity_c = SamGovEntityFactory.create(ebiz_poc_email="mymail@mail.com")

    task = CreateOrgsFromSamEntityTask(db_session)
    task.run()

    user_ids = {user_a.user_id, user_b.user_id, user_c.user_id}

    for entity in [entity_a, entity_b, entity_c]:
        assert entity.organization is not None
        assert {org_user.user_id for org_user in entity.organization.organization_users} == user_ids

    metrics = task.metrics
    assert metrics[task.Metrics.RECORDS_PROCESSED] == 9
    assert metrics[task.Metrics.NEW_ORGANIZATION_CREATED_COUNT] == 3
    assert metrics[task.Metrics.NEW_USER_ORGANIZATION_CREATED_COUNT] == 9


def test_run_task_multiple_different_email_addresses(enable_factory_create, db_session):
    user_a = LinkExternalUserFactory.create(email="entity_a@mail.com")
    user_b = LinkExternalUserFactory.create(email="entity_b@mail.com")
    user_c = LinkExternalUserFactory.create(email="entity_c@mail.com")
    user_blank_email = LinkExternalUserFactory(email="")

    entity_a = SamGovEntityFactory.create(ebiz_poc_email=user_a.email)
    entity_b = SamGovEntityFactory.create(ebiz_poc_email=user_b.email)
    entity_c = SamGovEntityFactory.create(ebiz_poc_email=user_c.email)
    entity_blank_email = SamGovEntityFactory(ebiz_poc_email="")

    task = CreateOrgsFromSamEntityTask(db_session)
    task.run()

    assert entity_a.organization is not None
    assert len(entity_a.organization.organization_users) == 1
    assert entity_a.organization.organization_users[0].user_id == user_a.user_id

    assert entity_b.organization is not None
    assert len(entity_b.organization.organization_users) == 1
    assert entity_b.organization.organization_users[0].user_id == user_b.user_id

    assert entity_c.organization is not None
    assert len(entity_c.organization.organization_users) == 1
    assert entity_c.organization.organization_users[0].user_id == user_c.user_id

    # Blank emails aren't picked up in the join logic
    assert entity_blank_email.organization is None
    assert len(user_blank_email.user.organization_users) == 0

    metrics = task.metrics
    assert metrics[task.Metrics.RECORDS_PROCESSED] == 3
    assert metrics[task.Metrics.NEW_ORGANIZATION_CREATED_COUNT] == 3
    assert metrics[task.Metrics.NEW_USER_ORGANIZATION_CREATED_COUNT] == 3


def test_run_task_varying_scenarios_org_exists(enable_factory_create, db_session):
    ### Everything already exists, won't be changed
    user_a = LinkExternalUserFactory.create(email="entity_a@mail.com")
    entity_a = SamGovEntityFactory.create(ebiz_poc_email=user_a.email, has_organization=True)
    OrganizationUserFactory.create(
        organization=entity_a.organization,
        user=user_a.user,
    )
    # Also has other random users with other emails that won't be affected/picked up
    OrganizationUserFactory.create(
        organization=entity_a.organization,
    )
    OrganizationUserFactory.create(
        organization=entity_a.organization,
    )

    ### User already exists, but is not an owner
    user_b = LinkExternalUserFactory.create(email="entity_b@mail.com")
    entity_b = SamGovEntityFactory.create(ebiz_poc_email=user_b.email, has_organization=True)
    OrganizationUserFactory.create(
        organization=entity_b.organization,
        user=user_b.user,
    )
    # Other random users in org will be unaffected
    OrganizationUserFactory.create(
        organization=entity_b.organization,
    )
    OrganizationUserFactory.create(
        organization=entity_b.organization,
    )
    OrganizationUserFactory.create(
        organization=entity_b.organization,
    )

    ### Org exists, but user is not a member/owner
    user_c = LinkExternalUserFactory.create(email="entity_c@mail.com")
    entity_c = SamGovEntityFactory.create(ebiz_poc_email=user_c.email, has_organization=True)
    # Other random users in org will be unaffected
    OrganizationUserFactory.create(
        organization=entity_c.organization,
    )

    # Various other users/entities that won't get picked up
    SamGovEntityFactory.create(ebiz_poc_email="random_email123@mail.com")
    SamGovEntityFactory.create(ebiz_poc_email="random_email456@mail.com")
    SamGovEntityFactory.create(ebiz_poc_email="random_email789@mail.com")
    LinkExternalUserFactory.create(email="another_email123@mail.com")
    LinkExternalUserFactory.create(email="another_email456@mail.com")
    LinkExternalUserFactory.create(email="another_email789@mail.com")

    task = CreateOrgsFromSamEntityTask(db_session)
    task.run()

    assert len(user_a.user.organization_users) == 1
    assert (
        user_a.user.organization_users[0].organization_id == entity_a.organization.organization_id
    )
    assert len(entity_a.organization.organization_users) == 3

    # TODO - other compares
    assert len(user_b.user.organization_users) == 1
    assert (
        user_b.user.organization_users[0].organization_id == entity_b.organization.organization_id
    )
    assert len(entity_b.organization.organization_users) == 4

    assert len(user_c.user.organization_users) == 1
    assert (
        user_c.user.organization_users[0].organization_id == entity_c.organization.organization_id
    )
    assert len(entity_c.organization.organization_users) == 2

    metrics = task.metrics
    assert metrics[task.Metrics.RECORDS_PROCESSED] == 3
    assert metrics[task.Metrics.NEW_ORGANIZATION_CREATED_COUNT] == 0
    assert metrics[task.Metrics.NEW_USER_ORGANIZATION_CREATED_COUNT] == 1
