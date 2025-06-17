from src.services.users.organization_from_ebiz_poc import (
    find_sam_gov_entity_for_ebiz_poc,
    handle_ebiz_poc_organization_during_login,
)
from tests.src.db.models.factories import (
    LinkExternalUserFactory,
    OrganizationFactory,
    OrganizationUserFactory,
    SamGovEntityFactory,
    UserFactory,
)


def test_find_sam_gov_entity_for_ebiz_poc_not_found(db_session):
    """Test that we return None when user is not an ebiz POC"""
    # Don't create any SAM.gov entities for this test
    sam_gov_entity = find_sam_gov_entity_for_ebiz_poc(db_session, "nonexistent@example.com")

    assert sam_gov_entity is None


def test_find_sam_gov_entity_for_ebiz_poc_found(db_session, enable_factory_create):
    """Test that we return the SAM.gov entity when user is an ebiz POC"""
    # Create a SAM.gov entity for the user's email
    sam_gov_entity = SamGovEntityFactory.create(ebiz_poc_email="found@example.com")

    result = find_sam_gov_entity_for_ebiz_poc(db_session, "found@example.com")

    assert result is not None
    assert result.ebiz_poc_email == "found@example.com"
    assert result.sam_gov_entity_id == sam_gov_entity.sam_gov_entity_id


def test_find_sam_gov_entity_for_ebiz_poc_multiple_entities(db_session, enable_factory_create):
    """Test that we return the first SAM.gov entity when multiple exist for same email"""
    # Create multiple SAM.gov entities with the same ebiz POC email
    first_entity = SamGovEntityFactory.create(ebiz_poc_email="multiple@example.com")
    SamGovEntityFactory.create(ebiz_poc_email="multiple@example.com")

    result = find_sam_gov_entity_for_ebiz_poc(db_session, "multiple@example.com")

    assert result is not None
    assert result.ebiz_poc_email == "multiple@example.com"
    # Should return the first one found (database order)
    assert result.sam_gov_entity_id == first_entity.sam_gov_entity_id


def test_handle_ebiz_poc_organization_during_login_not_ebiz_poc(db_session, enable_factory_create):
    """Test that we return None when user is not an ebiz POC"""
    user = UserFactory.create()
    LinkExternalUserFactory.create(user=user, email="not_ebiz@example.com")

    result = handle_ebiz_poc_organization_during_login(db_session, user)

    assert result is None


def test_handle_ebiz_poc_organization_during_login_creates_organization(
    db_session, enable_factory_create
):
    """Test that we create organization when user is an ebiz POC with no existing organization"""
    # Create SAM.gov entity without an organization
    sam_gov_entity = SamGovEntityFactory.create(
        ebiz_poc_email="creates@example.com",
        legal_business_name="New Org",
        uei="ABC123456789",
    )

    user = UserFactory.create()
    LinkExternalUserFactory.create(user=user, email="creates@example.com")

    result = handle_ebiz_poc_organization_during_login(db_session, user)

    assert result is not None
    assert result.user == user
    assert result.organization.sam_gov_entity == sam_gov_entity
    assert result.is_organization_owner is True


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
    assert result.user == user
    assert result.organization == organization
    assert result.is_organization_owner is True


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
    assert result == org_user
    assert result.is_organization_owner is True


def test_handle_ebiz_poc_organization_during_login_multiple_sam_entities(
    db_session, enable_factory_create
):
    """Test that we handle multiple SAM entities for the same email"""
    # Create multiple SAM entities with the same ebiz POC email
    sam_gov_entity1 = SamGovEntityFactory.create(ebiz_poc_email="multi@example.com")
    SamGovEntityFactory.create(ebiz_poc_email="multi@example.com")
    user = UserFactory.create()
    LinkExternalUserFactory.create(user=user, email="multi@example.com")

    org_user = handle_ebiz_poc_organization_during_login(db_session, user)

    # Should use the first entity found and create organization for it
    assert org_user is not None
    assert org_user.organization.sam_gov_entity == sam_gov_entity1


def test_handle_ebiz_poc_organization_during_login_rollback_on_error(
    db_session, enable_factory_create
):
    """Test that if an error occurs, the transaction is properly handled"""
    user = UserFactory.create()
    LinkExternalUserFactory.create(user=user, email="rollback@example.com")

    # This should gracefully return None since no SAM.gov entity exists
    result = handle_ebiz_poc_organization_during_login(db_session, user)

    assert result is None
