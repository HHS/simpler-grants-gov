import uuid
from datetime import date, datetime

from sqlalchemy import ForeignKey, UniqueConstraint, and_
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.ext.associationproxy import AssociationProxy, association_proxy
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql.functions import now as sqlnow

from src.adapters.db.type_decorators.postgres_type_decorators import LookupColumn
from src.constants.lookup_constants import ExternalUserType, Privilege, RoleType
from src.db.models.agency_models import Agency
from src.db.models.base import ApiSchemaTable, TimestampMixin
from src.db.models.competition_models import Application
from src.db.models.entity_models import Organization
from src.db.models.lookup_models import LkExternalUserType, LkPrivilege, LkRoleType
from src.db.models.opportunity_models import Opportunity
from src.util import datetime_util


class User(ApiSchemaTable, TimestampMixin):
    __tablename__ = "user"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)

    saved_opportunities: Mapped[list["UserSavedOpportunity"]] = relationship(
        "UserSavedOpportunity",
        back_populates="user",
        uselist=True,
        cascade="all, delete-orphan",
    )

    saved_searches: Mapped[list["UserSavedSearch"]] = relationship(
        "UserSavedSearch", back_populates="user", uselist=True, cascade="all, delete-orphan"
    )

    linked_login_gov_external_user: Mapped["LinkExternalUser | None"] = relationship(
        "LinkExternalUser",
        primaryjoin=lambda: and_(
            LinkExternalUser.user_id == User.user_id,
            LinkExternalUser.external_user_type == ExternalUserType.LOGIN_GOV,
        ),
        uselist=False,
        viewonly=True,
    )

    application_users: Mapped[list["ApplicationUser"]] = relationship(
        "ApplicationUser", back_populates="user", uselist=True, cascade="all, delete-orphan"
    )

    organization_users: Mapped[list["OrganizationUser"]] = relationship(
        "OrganizationUser", back_populates="user", uselist=True, cascade="all, delete-orphan"
    )

    agency_users: Mapped[list["AgencyUser"]] = relationship(
        "AgencyUser", back_populates="user", uselist=True, cascade="all, delete-orphan"
    )

    internal_user_roles: Mapped[list["InternalUserRole"]] = relationship(
        back_populates="user",
        uselist=True,
        cascade="all, delete-orphan",
    )

    api_keys: Mapped[list["UserApiKey"]] = relationship(
        "UserApiKey", back_populates="user", uselist=True, cascade="all, delete-orphan"
    )
    profile: Mapped["UserProfile | None"] = relationship(
        "UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )

    @property
    def email(self) -> str | None:
        if self.linked_login_gov_external_user is not None:
            return self.linked_login_gov_external_user.email
        return None

    @property
    def first_name(self) -> str | None:
        if self.profile is not None:
            return self.profile.first_name
        return None

    @property
    def last_name(self) -> str | None:
        if self.profile is not None:
            return self.profile.last_name
        return None

    @property
    def internal_roles(self) -> list["Role"]:
        return [iur.role for iur in self.internal_user_roles]


class LinkExternalUser(ApiSchemaTable, TimestampMixin):
    __tablename__ = "link_external_user"

    link_external_user_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)

    external_user_id: Mapped[str] = mapped_column(index=True, unique=True)

    external_user_type: Mapped[ExternalUserType] = mapped_column(
        "external_user_type_id",
        LookupColumn(LkExternalUserType),
        ForeignKey(LkExternalUserType.external_user_type_id),
        index=True,
    )

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey(User.user_id), index=True)
    user: Mapped[User] = relationship(User)

    email: Mapped[str] = mapped_column(index=True)


class UserTokenSession(ApiSchemaTable, TimestampMixin):
    __tablename__ = "user_token_session"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey(User.user_id), primary_key=True)
    user: Mapped[User] = relationship(User)

    token_id: Mapped[uuid.UUID] = mapped_column(primary_key=True)

    expires_at: Mapped[datetime]

    # When a user logs out, we set this flag to False.
    is_valid: Mapped[bool] = mapped_column(default=True)


class LoginGovState(ApiSchemaTable, TimestampMixin):
    """Table used to store temporary state during the OAuth login flow"""

    __tablename__ = "login_gov_state"

    login_gov_state_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True)

    # https://openid.net/specs/openid-connect-core-1_0.html#NonceNotes
    nonce: Mapped[uuid.UUID]


class UserSavedOpportunity(ApiSchemaTable, TimestampMixin):
    __tablename__ = "user_saved_opportunity"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey(User.user_id), primary_key=True)
    opportunity_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(Opportunity.opportunity_id), primary_key=True
    )

    last_notified_at: Mapped[datetime] = mapped_column(
        default=datetime_util.utcnow, server_default="NOW()", nullable=False
    )

    user: Mapped[User] = relationship(User, back_populates="saved_opportunities")
    opportunity: Mapped[Opportunity] = relationship(
        "Opportunity", back_populates="saved_opportunities_by_users"
    )
    is_deleted: Mapped[bool | None]


class UserSavedSearch(ApiSchemaTable, TimestampMixin):
    """Table for storing saved search queries for users"""

    __tablename__ = "user_saved_search"

    saved_search_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey(User.user_id), index=True)
    user: Mapped[User] = relationship(User, back_populates="saved_searches")

    search_query: Mapped[dict] = mapped_column(JSONB)

    name: Mapped[str]

    last_notified_at: Mapped[datetime] = mapped_column(
        nullable=False,
        default=datetime_util.utcnow,
        server_default=sqlnow(),
    )

    searched_opportunity_ids: Mapped[list[uuid.UUID]] = mapped_column(ARRAY(UUID))
    is_deleted: Mapped[bool | None]


class UserNotificationLog(ApiSchemaTable, TimestampMixin):
    __tablename__ = "user_notification_log"

    user_notification_log_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey(User.user_id), index=True)
    user: Mapped[User] = relationship(User)

    notification_reason: Mapped[str]
    notification_sent: Mapped[bool]


class UserOpportunityNotificationLog(ApiSchemaTable, TimestampMixin):
    __tablename__ = "user_opportunity_notification_log"

    user_opportunity_notification_log_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey(User.user_id), index=True)
    user: Mapped[User] = relationship(User)

    opportunity_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(Opportunity.opportunity_id), index=True
    )
    opportunity: Mapped[Opportunity] = relationship(
        "Opportunity", back_populates="all_opportunity_notification_logs"
    )


class ApplicationUser(ApiSchemaTable, TimestampMixin):
    """Link table between User and Application"""

    __tablename__ = "application_user"

    __table_args__ = (
        # A user can only be associated with an application once
        UniqueConstraint("application_id", "user_id"),
        # Need to define the table args like this to inherit whatever we set on the super table
        # otherwise we end up overwriting things and Alembic remakes the whole table
        ApiSchemaTable.__table_args__,
    )

    application_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )

    application_id: Mapped[uuid.UUID] = mapped_column(
        UUID,
        ForeignKey("api.application.application_id"),
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey("api.user.user_id"), index=True)

    application: Mapped[Application] = relationship(Application, back_populates="application_users")
    user: Mapped[User] = relationship(User, back_populates="application_users")
    application_user_roles: Mapped[list["ApplicationUserRole"]] = relationship(
        back_populates="application_user",
        uselist=True,
        cascade="all, delete-orphan",
        lazy="selectin",  # preload roles
    )

    @property
    def roles(self) -> list["Role"]:
        return [aur.role for aur in self.application_user_roles]


class OrganizationUser(ApiSchemaTable, TimestampMixin):
    __tablename__ = "organization_user"

    __table_args__ = (
        # A user can only be in an organization once
        UniqueConstraint("organization_id", "user_id"),
        # Need to define the table args like this to inherit whatever we set on the super table
        # otherwise we end up overwriting things and Alembic remakes the whole table
        ApiSchemaTable.__table_args__,
    )

    organization_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )

    is_organization_owner: Mapped[bool]

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(Organization.organization_id), index=True
    )
    organization: Mapped[Organization] = relationship(
        Organization, back_populates="organization_users", uselist=False
    )
    organization_user_roles: Mapped[list["OrganizationUserRole"]] = relationship(
        back_populates="organization_user",
        uselist=True,
        cascade="all, delete-orphan",
        lazy="selectin",  # preload roles
    )

    user_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey(User.user_id), index=True)
    user: Mapped[User] = relationship(User, back_populates="organization_users", uselist=False)

    @property
    def roles(self) -> list["Role"]:
        return [our.role for our in self.organization_user_roles]


class SuppressedEmail(ApiSchemaTable, TimestampMixin):
    __tablename__ = "suppressed_email"

    suppressed_email_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(index=True)
    reason: Mapped[str]
    last_update_time: Mapped[datetime] = mapped_column(index=True)


class UserApiKey(ApiSchemaTable, TimestampMixin):
    """API Key table for user authentication to the API"""

    __tablename__ = "user_api_key"

    api_key_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    key_name: Mapped[str]
    key_id: Mapped[str] = mapped_column(
        unique=True, index=True, comment="AWS API Gateway key identifier"
    )
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey(User.user_id), index=True)
    last_used: Mapped[datetime | None]
    is_active: Mapped[bool] = mapped_column(default=True)

    user: Mapped[User] = relationship(User, back_populates="api_keys", uselist=False)


class Role(ApiSchemaTable, TimestampMixin):
    __tablename__ = "role"

    role_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    role_name: Mapped[str]
    is_core: Mapped[bool] = mapped_column(default=False)

    link_privileges: Mapped[list["LinkRolePrivilege"]] = relationship(
        back_populates="role",
        uselist=True,
        cascade="all, delete-orphan",
        lazy="selectin",  # preload privileges
    )
    link_role_types: Mapped[list["LinkRoleRoleType"]] = relationship(
        back_populates="role", uselist=True, cascade="all, delete-orphan"
    )

    privileges: AssociationProxy[set[Privilege]] = association_proxy(
        "link_privileges",
        "privilege",
        creator=lambda obj: LinkRolePrivilege(privilege=obj),
    )
    role_types: AssociationProxy[set[RoleType]] = association_proxy(
        "link_role_types",
        "role_type",
        creator=lambda obj: LinkRoleRoleType(role_type=obj),
    )


class LinkRoleRoleType(ApiSchemaTable, TimestampMixin):
    __tablename__ = "link_role_role_type"

    role_id: Mapped[uuid.UUID] = mapped_column(ForeignKey(Role.role_id), primary_key=True)
    role: Mapped[Role] = relationship(Role)

    role_type: Mapped[RoleType] = mapped_column(
        "role_type_id",
        LookupColumn(LkRoleType),
        ForeignKey(LkRoleType.role_type_id),
        primary_key=True,
        index=True,
    )


class LinkRolePrivilege(ApiSchemaTable, TimestampMixin):
    __tablename__ = "link_role_privilege"

    role_id: Mapped[uuid.UUID] = mapped_column(ForeignKey(Role.role_id), primary_key=True)
    role: Mapped[Role] = relationship(Role)

    privilege: Mapped[Privilege] = mapped_column(
        "privilege_id",
        LookupColumn(LkPrivilege),
        ForeignKey(LkPrivilege.privilege_id),
        primary_key=True,
        index=True,
    )


class InternalUserRole(ApiSchemaTable, TimestampMixin):
    __tablename__ = "internal_user_role"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey(User.user_id), primary_key=True)
    user: Mapped[User] = relationship(User)

    role_id: Mapped[uuid.UUID] = mapped_column(ForeignKey(Role.role_id), primary_key=True)
    role: Mapped[Role] = relationship(Role, lazy="selectin")  # preload role


class ApplicationUserRole(ApiSchemaTable, TimestampMixin):
    __tablename__ = "application_user_role"

    application_user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey(ApplicationUser.application_user_id), primary_key=True
    )
    application_user: Mapped[ApplicationUser] = relationship(ApplicationUser)

    role_id: Mapped[uuid.UUID] = mapped_column(ForeignKey(Role.role_id), primary_key=True)
    role: Mapped[Role] = relationship(Role, lazy="selectin")  # preload role


class OrganizationUserRole(ApiSchemaTable, TimestampMixin):
    __tablename__ = "organization_user_role"

    organization_user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey(OrganizationUser.organization_user_id), primary_key=True
    )
    organization_user: Mapped[OrganizationUser] = relationship(
        OrganizationUser, back_populates="organization_user_roles"
    )

    role_id: Mapped[uuid.UUID] = mapped_column(ForeignKey(Role.role_id), primary_key=True)
    role: Mapped[Role] = relationship(Role, lazy="selectin")  # preload role


class AgencyUser(ApiSchemaTable, TimestampMixin):
    __tablename__ = "agency_user"

    agency_user_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    agency_id: Mapped[uuid.UUID] = mapped_column(ForeignKey(Agency.agency_id), index=True)
    agency: Mapped[Agency] = relationship(Agency)

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey(User.user_id), index=True)
    user: Mapped[User] = relationship(User)
    agency_user_roles: Mapped[list["AgencyUserRole"]] = relationship(
        back_populates="agency_user",
        uselist=True,
        cascade="all, delete-orphan",
        lazy="selectin",  # preload roles
    )

    @property
    def roles(self) -> list["Role"]:
        return [aur.role for aur in self.agency_user_roles]


class AgencyUserRole(ApiSchemaTable, TimestampMixin):
    __tablename__ = "agency_user_role"

    agency_user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey(AgencyUser.agency_user_id), primary_key=True
    )
    agency_user: Mapped[AgencyUser] = relationship(AgencyUser)

    role_id: Mapped[uuid.UUID] = mapped_column(ForeignKey(Role.role_id), primary_key=True)
    role: Mapped[Role] = relationship(Role, lazy="selectin")  # preload role


class UserProfile(ApiSchemaTable, TimestampMixin):
    __tablename__ = "user_profile"
    user_profile_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey(User.user_id), unique=True)
    user: Mapped[User] = relationship(User, back_populates="profile", uselist=False)

    first_name: Mapped[str]
    middle_name: Mapped[str | None]
    last_name: Mapped[str]


class LegacyCertificate(ApiSchemaTable, TimestampMixin):
    __tablename__ = "legacy_certificate"

    legacy_certificate_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )
    cert_id: Mapped[str] = mapped_column(index=True, nullable=False)
    serial_number: Mapped[str] = mapped_column(index=True, nullable=False)
    expiration_date: Mapped[date] = mapped_column(index=True, nullable=False)

    user_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey(User.user_id), nullable=False)
    user: Mapped[User] = relationship(User)

    agency_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey(Agency.agency_id))
    agency: Mapped[Agency] = relationship(Agency)

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(Organization.organization_id)
    )
    organization: Mapped[Organization] = relationship(Organization)
