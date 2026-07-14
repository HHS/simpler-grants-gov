import uuid

from grants_shared.adapters.db.type_decorators.postgres_type_decorators import LookupColumn
from grants_shared.db.models.base import TimestampMixin
from sqlalchemy import UUID, ForeignKey
from sqlalchemy.ext.associationproxy import AssociationProxy, association_proxy
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.constants.lookup_constants import MgmtPrivilege, MgmtResourceType
from src.db.models.grantor_schema_table import GrantorSchemaTable
from src.db.models.lookup_models import LkMgmtPrivilege, LkMgmtResourceType
from src.db.models.user_models import MgmtUser

########################
# Core Resource Table
########################


class MgmtResource(GrantorSchemaTable, TimestampMixin):
    __tablename__ = "mgmt_resource"

    mgmt_resource_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)

    mgmt_resource_type: Mapped[MgmtResourceType] = mapped_column(
        "mgmt_resource_type_id",
        LookupColumn(LkMgmtResourceType),
        ForeignKey(LkMgmtResourceType.mgmt_resource_type_id),
    )


class AbstractResourceTableMixin:
    """
    An abstract mixin that you can add to any resource tables

    To do this, define your table with a primary key pointing
    to the resource table and return that value from the get_resource_id function
    and return a static resource type from get_resource_type.

    NOTE: We don't implement this as an abstract class because
          that uses a metaclass. SQLAlchemy also uses a metaclass,
          and you can't define a class with two metaclasses in
          the hierarchy - so instead make this pseudo-abstract approach.
    """

    def get_resource_id(self) -> uuid.UUID:
        raise NotImplementedError

    def get_resource_type(self) -> MgmtResourceType:
        raise NotImplementedError

    def set_resource(self, resource: MgmtResource) -> None:
        self.resource = resource


########################
# Specific Resources
#
# We might want to move some of these in the future
# depending on what we add resource models over time.
########################


class MgmtInternalResource(GrantorSchemaTable, TimestampMixin, AbstractResourceTableMixin):
    __tablename__ = "mgmt_internal_resource"

    mgmt_internal_resource_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(MgmtResource.mgmt_resource_id), primary_key=True, default=uuid.uuid4
    )
    resource: Mapped[MgmtResource] = relationship(
        MgmtResource, single_parent=True, cascade="all, delete-orphan"
    )

    internal_resource_name: Mapped[str]

    def get_resource_id(self) -> uuid.UUID:
        return self.mgmt_internal_resource_id

    def get_resource_type(self) -> MgmtResourceType:
        return MgmtResourceType.INTERNAL


class Department(GrantorSchemaTable, TimestampMixin, AbstractResourceTableMixin):
    __tablename__ = "department"

    department_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(MgmtResource.mgmt_resource_id), primary_key=True, default=uuid.uuid4
    )
    resource: Mapped[MgmtResource] = relationship(
        MgmtResource, single_parent=True, cascade="all, delete-orphan"
    )

    department_name: Mapped[str]

    def get_resource_id(self) -> uuid.UUID:
        return self.department_id

    def get_resource_type(self) -> MgmtResourceType:
        return MgmtResourceType.DEPARTMENT


class Subagency(GrantorSchemaTable, TimestampMixin, AbstractResourceTableMixin):
    __tablename__ = "subagency"

    subagency_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(MgmtResource.mgmt_resource_id), primary_key=True, default=uuid.uuid4
    )
    resource: Mapped[MgmtResource] = relationship(
        MgmtResource, single_parent=True, cascade="all, delete-orphan"
    )

    subagency_name: Mapped[str]

    department_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey(Department.department_id))
    department: Mapped[Department] = relationship(Department)

    def get_resource_id(self) -> uuid.UUID:
        return self.subagency_id

    def get_resource_type(self) -> MgmtResourceType:
        return MgmtResourceType.SUBAGENCY


class Team(GrantorSchemaTable, TimestampMixin, AbstractResourceTableMixin):
    __tablename__ = "team"

    team_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(MgmtResource.mgmt_resource_id), primary_key=True, default=uuid.uuid4
    )
    resource: Mapped[MgmtResource] = relationship(
        MgmtResource, single_parent=True, cascade="all, delete-orphan"
    )

    team_name: Mapped[str]

    subagency_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey(Subagency.subagency_id))
    subagency: Mapped[Subagency] = relationship(Subagency)

    def get_resource_id(self) -> uuid.UUID:
        return self.team_id

    def get_resource_type(self) -> MgmtResourceType:
        return MgmtResourceType.TEAM


########################
# Role / authZ related tables
########################


class MgmtResourceUser(GrantorSchemaTable, TimestampMixin):
    __tablename__ = "mgmt_resource_user"

    mgmt_resource_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )

    mgmt_resource_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(MgmtResource.mgmt_resource_id), index=True
    )
    mgmt_resource: Mapped[MgmtResource] = relationship(MgmtResource)

    mgmt_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(MgmtUser.mgmt_user_id), index=True
    )
    mgmt_user: Mapped[MgmtUser] = relationship(MgmtUser)

    roles: Mapped[list[MgmtResourceUserRole]] = relationship(
        back_populates="mgmt_resource_user",
        uselist=True,
        cascade="all, delete-orphan",
        lazy="selectin",  # preload roles
    )


class MgmtRole(GrantorSchemaTable, TimestampMixin):
    __tablename__ = "mgmt_role"

    mgmt_role_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    role_name: Mapped[str]
    is_core: Mapped[bool] = mapped_column(default=False)

    link_privileges: Mapped[list[MgmtLinkRolePrivilege]] = relationship(
        back_populates="mgmt_role",
        uselist=True,
        cascade="all, delete-orphan",
        lazy="selectin",  # always load the privileges
    )

    link_role_resource_types: Mapped[list[MgmtLinkRoleResourceType]] = relationship(
        back_populates="mgmt_role",
        uselist=True,
        cascade="all, delete-orphan",
        lazy="selectin",  # Preload resource types
    )

    privileges: AssociationProxy[set[MgmtPrivilege]] = association_proxy(
        "link_privileges",
        "mgmt_privilege",
        creator=lambda obj: MgmtLinkRolePrivilege(mgmt_privilege=obj),
    )

    resource_types: AssociationProxy[set[MgmtResourceType]] = association_proxy(
        "link_role_resource_types",
        "mgmt_resource_type",
        creator=lambda obj: MgmtLinkRoleResourceType(mgmt_resource_type=obj),
    )


class MgmtResourceUserRole(GrantorSchemaTable, TimestampMixin):
    __tablename__ = "mgmt_resource_user_role"

    mgmt_resource_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(MgmtResourceUser.mgmt_resource_user_id), primary_key=True
    )
    mgmt_resource_user: Mapped[MgmtResourceUser] = relationship(MgmtResourceUser)

    mgmt_role_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(MgmtRole.mgmt_role_id), primary_key=True
    )
    mgmt_role: Mapped[MgmtRole] = relationship(MgmtRole, lazy="selectin")  # always preload role


class MgmtLinkRolePrivilege(GrantorSchemaTable, TimestampMixin):
    __tablename__ = "mgmt_link_role_privilege"

    mgmt_role_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(MgmtRole.mgmt_role_id), primary_key=True
    )
    mgmt_role: Mapped[MgmtRole] = relationship(MgmtRole)

    mgmt_privilege: Mapped[MgmtPrivilege] = mapped_column(
        "mgmt_privilege_id",
        LookupColumn(LkMgmtPrivilege),
        ForeignKey(LkMgmtPrivilege.mgmt_privilege_id),
        primary_key=True,
    )


class MgmtLinkRoleResourceType(GrantorSchemaTable, TimestampMixin):
    __tablename__ = "mgmt_link_role_resource_type"

    mgmt_role_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(MgmtRole.mgmt_role_id), primary_key=True
    )
    mgmt_role: Mapped[MgmtRole] = relationship(MgmtRole)

    mgmt_resource_type: Mapped[MgmtResourceType] = mapped_column(
        "mgmt_resource_type_id",
        LookupColumn(LkMgmtResourceType),
        ForeignKey(LkMgmtResourceType.mgmt_resource_type_id),
        primary_key=True,
    )
