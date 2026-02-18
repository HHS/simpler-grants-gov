import dataclasses
import logging
import uuid
from typing import Self

import src.adapters.db as db
import tests.src.db.models.factories as factories
from src.auth.api_jwt_auth import ApiJwtConfig, create_jwt_for_user
from src.constants.lookup_constants import Privilege, RoleType
from src.db.models.agency_models import Agency
from src.db.models.competition_models import Competition, Form
from src.db.models.entity_models import Organization
from src.db.models.user_models import AgencyUserRole, OrganizationUserRole, Role, User

logger = logging.getLogger(__name__)


@dataclasses.dataclass
class CompetitionContainer:
    static_competition_with_all_forms: Competition
    competition_with_all_forms: Competition

    form_specific_competitions: dict[uuid.UUID, tuple[Form, Competition]] = dataclasses.field(
        default_factory=dict
    )

    def add_form_competition(self, form: Form, competition: Competition) -> None:
        self.form_specific_competitions[form.form_id] = form, competition

    def get_comp_for_form(self, form: Form) -> Competition | None:
        return self.form_specific_competitions.get(form.form_id)[1]


class UserBuilder:
    """Builder class for setting up a user for local development"""

    def __init__(self, user_id: uuid.UUID, db_session: db.Session, scenario_name: str) -> None:
        self.user: User = db_session.merge(factories.UserFactory.build(user_id=user_id), load=True)
        self.db_session = db_session
        self.scenario_name = scenario_name

        self.link_external_id = None
        self.api_key_id = None
        self.jwt_token = None

    def with_oauth_login(self, external_user_id: str) -> Self:
        """Add an oauth login record that you can use to login as a user

        For example, if you passed in "my_example_user", you could
        manually login to that user by typing "my_example_user" into
        the Mock OAuth login page.
        """
        external_user = self.user.linked_login_gov_external_user
        if external_user is None:
            external_user = factories.LinkExternalUserFactory.build(user=self.user)

        external_user.external_user_id = external_user_id
        self.db_session.add(external_user)

        self.link_external_id = external_user_id
        return self

    def with_api_key(self, key_id: str) -> Self:
        """Add an api key record that you can use with our X-API-Key login header"""
        # See if we previously setup this API key
        user_api_key = None
        for key in self.user.api_keys:
            if key.key_id == key_id:
                user_api_key = key
                break

        if user_api_key is None:
            user_api_key = factories.UserApiKeyFactory.build(user=self.user)

        user_api_key.key_id = key_id

        self.db_session.add(user_api_key)

        self.api_key_id = key_id
        return self

    def with_jwt_auth(self, token_expiration_minutes: int = 60 * 24 * 365 * 30) -> Self:
        """Add API jwt auth to the user. By default it will expire 30 years in the future for easier development."""
        config = ApiJwtConfig(API_JWT_TOKEN_EXPIRATION_MINUTES=token_expiration_minutes)
        token, _ = create_jwt_for_user(
            self.user, self.db_session, config=config, email=self.user.email
        )
        self.jwt_token = token
        return self

    def with_organization(self, organization: Organization, roles: list[Role]) -> Self:
        """Add a user to an organization with a specified set of roles"""
        # First see if this user is already a member of the organization provided
        org_user = None
        for organization_user in self.user.organization_users:
            if organization_user.organization_id == organization.organization_id:
                org_user = organization_user
                break

        if org_user is None:
            org_user = factories.OrganizationUserFactory.build(
                user=self.user, organization=organization
            )
            self.db_session.add(org_user)

        organization_user_roles = []
        for role in roles:
            organization_user_roles.append(
                OrganizationUserRole(organization_user=org_user, role_id=role.role_id)
            )

        org_user.organization_user_roles = organization_user_roles

        return self

    def with_agency(self, agency: Agency, roles: list[Role]) -> Self:
        """Add a user to an agency with a specified set of roles"""
        # First see if this user is already a member of the agency provided
        agency_user = None
        for a_user in self.user.agency_users:
            if a_user.agency_id == agency.agency_id:
                agency_user = a_user
                break

        if agency_user is None:
            agency_user = factories.AgencyUserFactory.build(user=self.user, agency=agency)
            self.db_session.add(agency_user)

        agency_user_roles = []
        for role in roles:
            agency_user_roles.append(AgencyUserRole(agency_user=agency_user, role_id=role.role_id))

        agency_user.agency_user_roles = agency_user_roles

        return self

    def with_internal_role(self, role_name: str, privileges: list[Privilege]) -> Self:
        """Assign an internal role with specific privileges to the user"""
        role = factories.RoleFactory.create(
            role_name=role_name, is_core=True, privileges=privileges
        )
        factories.LinkRoleRoleTypeFactory.create(role=role, role_type=RoleType.INTERNAL)

        factories.InternalUserRoleFactory.create(user=self.user, role=role)

        return self

    def with_profile(self, first_name: str, last_name: str, middle_name: str | None = None) -> Self:
        """Add a profile to the user."""
        self.db_session.merge(
            factories.UserProfileFactory.build(
                user=self.user, first_name=first_name, middle_name=middle_name, last_name=last_name
            ),
            load=True,
        )

        return self

    def build(self) -> User:
        log_msg = f"Updating {self.scenario_name}:"
        if self.link_external_id:
            log_msg += f" '{self.link_external_id}'"
        if self.api_key_id:
            log_msg += f" with X-API-Key: '{self.api_key_id}'"
        if self.jwt_token:
            log_msg += f" with X-SGG-Token: '{self.jwt_token}'"
        logger.info(log_msg)
        return self.user
