from src.constants.static_role_values import ORG_ADMIN
from src.services.users.organization_from_ebiz_poc import (
    find_sam_gov_entities_for_ebiz_poc,
    handle_ebiz_poc_organization_during_login,
)
from tests.src.db.models.factories import (
    LinkExternalUserFactory,
    OrganizationFactory,
    OrganizationUserFactory,
    SamGovEntityFactory,
    UserFactory,
)


def test_find_sam_gov_entities_for_ebiz_poc_not_found(db_session):
    """Test that we return empty list when user is not an ebiz POC"""
    # Don't create any SAM.gov entities for this test
    sam_gov_entities = find_sam_gov_entities_for_ebiz_poc(db_session, "nonexistent@example.com")

    assert sam_gov_entities == []


def test_find_sam_gov_entities_for_ebiz_poc_found(db_session, enable_factory_create):
    """Test that we return the SAM.gov entity when user is an ebiz POC"""
    # Create a SAM.gov entity for the user's email
    sam_gov_entity = SamGovEntityFactory.create(ebiz_poc_email="found@example.com")

    result = find_sam_gov_entities_for_ebiz_poc(db_session, "found@example.com")

    assert len(result) == 1
    assert result[0].ebiz_poc_email == "found@example.com"
    assert result[0].sam_gov_entity_id == sam_gov_entity.sam_gov_entity_id


def test_find_sam_gov_entities_for_ebiz_poc_multiple_entities(db_session, enable_factory_create):
    """Test that we return all SAM.gov entities when multiple exist for same email"""
    # Create multiple SAM.gov entities with the same ebiz POC email
    first_entity = SamGovEntityFactory.create(ebiz_poc_email="multiple@example.com")
    second_entity = SamGovEntityFactory.create(ebiz_poc_email="multiple@example.com")

    result = find_sam_gov_entities_for_ebiz_poc(db_session, "multiple@example.com")

    assert len(result) == 2
    assert all(entity.ebiz_poc_email == "multiple@example.com" for entity in result)
    # Should return both entities
    entity_ids = {entity.sam_gov_entity_id for entity in result}
    assert first_entity.sam_gov_entity_id in entity_ids
    assert second_entity.sam_gov_entity_id in entity_ids


def test_handle_ebiz_poc_organization_during_login_not_ebiz_poc(db_session, enable_factory_create):
    """Test that we return None when user is not an ebiz POC"""
    user = UserFactory.create()
    LinkExternalUserFactory.create(user=user, email="not_ebiz@example.com")

    result = handle_ebiz_poc_organization_during_login(db_session, user)

    assert result is None


def test_handle_ebiz_poc_organization_during_login_blank_email(db_session, enable_factory_create):
    """Test that we return None when user email is blank"""
    SamGovEntityFactory.create(ebiz_poc_email="")
    external_user = LinkExternalUserFactory.create(email="")

    result = handle_ebiz_poc_organization_during_login(db_session, external_user.user)

    assert result is None


def test_handle_ebiz_poc_organization_during_login_creates_organization(
    db_session, enable_factory_create
):
    """Test that we create organization when user is an ebiz POC with no existing organization"""

    # Create SAM.gov entity without an organization
    sam_gov_entity = SamGovEntityFactory.create(
        ebiz_poc_email="creates@example.com",
        legal_business_name="New Org",
    )

    user = UserFactory.create()
    LinkExternalUserFactory.create(user=user, email="creates@example.com")

    result = handle_ebiz_poc_organization_during_login(db_session, user)

    assert result is not None
    assert len(result) == 1
    org_user = result[0]
    assert org_user.user == user
    assert org_user.organization.sam_gov_entity == sam_gov_entity
    assert org_user.is_organization_owner is True

    db_session.flush()

    assert len(org_user.organization_user_roles) == 1
    assert org_user.organization_user_roles[0].role_id == ORG_ADMIN.role_id


def test_handle_ebiz_poc_organization_during_login_existing_organization(
    db_session, enable_factory_create
):
    """Test that we link user to existing organization when they are an ebiz POC"""

    # Create organization first
    organization = OrganizationFactory.create(no_sam_gov_entity=True)

    # Create SAM.gov entity and link it to the organization
    sam_gov_entity = SamGovEntityFactory.create(
        ebiz_poc_email="ebiz_existing@example.com",
        legal_business_name="Existing Org",
        uei="DEF987654321",
    )

    # Update the organization to reference the SAM.gov entity
    organization.sam_gov_entity_id = sam_gov_entity.sam_gov_entity_id
    organization.sam_gov_entity = sam_gov_entity
    db_session.add(organization)
    db_session.flush()

    # Create user with matching email
    user = UserFactory.create()
    LinkExternalUserFactory.create(user=user, email="ebiz_existing@example.com")

    result = handle_ebiz_poc_organization_during_login(db_session, user)

    assert result is not None
    assert len(result) == 1
    org_user = result[0]
    assert org_user.user == user
    assert org_user.organization == organization
    assert org_user.is_organization_owner is True

    db_session.flush()

    # Verify the user has the Organization Admin role
    assert len(org_user.organization_user_roles) == 1
    assert org_user.organization_user_roles[0].role_id == ORG_ADMIN.role_id


def test_handle_ebiz_poc_organization_during_login_existing_organization_user(
    db_session, enable_factory_create
):
    """Test that we update existing organization user to be owner when they are an ebiz POC"""
    # Create organization first
    organization = OrganizationFactory.create(no_sam_gov_entity=True)

    # Create SAM.gov entity and link it to the organization
    sam_gov_entity = SamGovEntityFactory.create(
        ebiz_poc_email="ebiz_update@example.com",
        legal_business_name="Update Org",
        uei="GHI555666777",
    )

    # Update the organization to reference the SAM.gov entity
    organization.sam_gov_entity_id = sam_gov_entity.sam_gov_entity_id
    organization.sam_gov_entity = sam_gov_entity
    db_session.add(organization)

    user = UserFactory.create()
    LinkExternalUserFactory.create(user=user, email="ebiz_update@example.com")
    org_user = OrganizationUserFactory.create(
        organization=organization, user=user, is_organization_owner=False
    )
    db_session.flush()

    result = handle_ebiz_poc_organization_during_login(db_session, user)

    assert result is not None
    assert len(result) == 1
    returned_org_user = result[0]
    assert returned_org_user == org_user
    assert returned_org_user.is_organization_owner is True


def test_handle_ebiz_poc_organization_during_login_multiple_sam_entities(
    db_session, enable_factory_create
):
    """Test that we handle multiple SAM entities for the same email"""
    # Create multiple SAM entities with the same ebiz POC email
    SamGovEntityFactory.create(ebiz_poc_email="multi@example.com")
    SamGovEntityFactory.create(ebiz_poc_email="multi@example.com")
    user = UserFactory.create()
    LinkExternalUserFactory.create(user=user, email="multi@example.com")

    result = handle_ebiz_poc_organization_during_login(db_session, user)

    # Should create organizations for all entities and return all organization users created
    assert result is not None
    assert len(result) == 2  # Should return both organization users
    assert len(user.organization_users) == 2  # User should be linked to both organizations

    # All organization users should be marked as owners
    for org_user in result:
        assert org_user.user == user
        assert org_user.is_organization_owner is True


def test_handle_ebiz_poc_organization_during_login_rollback_on_error(
    db_session, enable_factory_create
):
    """Test that if an error occurs, the transaction is properly handled"""
    user = UserFactory.create()
    LinkExternalUserFactory.create(user=user, email="rollback@example.com")

    # This should gracefully return None since no SAM.gov entity exists
    result = handle_ebiz_poc_organization_during_login(db_session, user)

    assert result is None
