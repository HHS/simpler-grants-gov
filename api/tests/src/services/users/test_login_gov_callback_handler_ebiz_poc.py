from src.constants.static_role_values import ORG_ADMIN
from src.services.users.organization_from_ebiz_poc import handle_ebiz_poc_organization_during_login
from tests.src.db.models.factories import (
    LinkExternalUserFactory,
    OrganizationFactory,
    SamGovEntityFactory,
    UserFactory,
)


def test_ebiz_poc_organization_during_login_creates_organization(enable_factory_create, db_session):
    """Test that new users who are ebiz POCs get organization created and linked"""
    # Create a SAM.gov entity for the user's email
    sam_gov_entity = SamGovEntityFactory.create(
        ebiz_poc_email="integration_creates@example.com",
        legal_business_name="Test Organization",
    )
    user = UserFactory.create()
    LinkExternalUserFactory.create(user=user, email="integration_creates@example.com")

    # Call the service directly
    result = handle_ebiz_poc_organization_during_login(db_session, user)

    assert result is not None
    assert len(result) == 1
    org_user = result[0]
    assert org_user.user == user
    assert org_user.organization.sam_gov_entity == sam_gov_entity
    assert org_user.is_organization_owner is True

    db_session.flush()

    # Verify the user has the Organization Admin role
    assert len(org_user.organization_user_roles) == 1
    assert org_user.organization_user_roles[0].role_id == ORG_ADMIN.role_id


def test_ebiz_poc_organization_during_login_existing_organization(
    enable_factory_create, db_session
):
    """Test that users get linked to existing organizations when they are ebiz POCs"""
    # Create organization first
    organization = OrganizationFactory.create(no_sam_gov_entity=True)

    # Create SAM.gov entity and link it to the organization
    sam_gov_entity = SamGovEntityFactory.create(
        ebiz_poc_email="integration_existing@example.com",
        legal_business_name="Existing Organization",
        uei="DEF456789012",
    )

    # Update the organization to reference the SAM.gov entity
    organization.sam_gov_entity_id = sam_gov_entity.sam_gov_entity_id
    organization.sam_gov_entity = sam_gov_entity
    db_session.add(organization)
    db_session.flush()

    user = UserFactory.create()
    LinkExternalUserFactory.create(user=user, email="integration_existing@example.com")

    # Call the service directly
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


def test_ebiz_poc_organization_during_login_not_ebiz_poc(enable_factory_create, db_session):
    """Test that users who are not ebiz POCs don't get organizations created"""
    user = UserFactory.create()
    LinkExternalUserFactory.create(user=user, email="integration_not_ebiz@example.com")

    # Call the service directly
    org_user = handle_ebiz_poc_organization_during_login(db_session, user)

    assert org_user is None


def test_ebiz_poc_organization_during_login_multiple_sam_entities(
    enable_factory_create, db_session
):
    """Test handling of multiple SAM entities with same ebiz POC email"""
    # Create multiple SAM entities with the same ebiz POC email
    SamGovEntityFactory.create(ebiz_poc_email="integration_multi@example.com")
    SamGovEntityFactory.create(ebiz_poc_email="integration_multi@example.com")

    user = UserFactory.create()
    LinkExternalUserFactory.create(user=user, email="integration_multi@example.com")

    # Call the service directly
    result = handle_ebiz_poc_organization_during_login(db_session, user)

    assert result is not None
    assert len(result) == 2  # Should return both organization users

    db_session.flush()

    # Verify all organization users are for the same user and are owners
    for org_user in result:
        assert org_user.user == user
        assert org_user.is_organization_owner is True
        # Verify each user has the Organization Admin role
        assert len(org_user.organization_user_roles) == 1
        assert org_user.organization_user_roles[0].role_id == ORG_ADMIN.role_id

    # Verify user is linked to both organizations
    assert len(user.organization_users) == 2
