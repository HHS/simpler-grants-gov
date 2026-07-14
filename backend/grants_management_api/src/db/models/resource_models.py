from grants_shared.adapters.db.type_decorators.postgres_type_decorators import LookupColumn
from grants_shared.db.models.base import TimestampMixin
from sqlalchemy.ext.associationproxy import AssociationProxy, association_proxy

from src.constants.lookup_constants import MgmtResourceType, MgmtPrivilege
from src.db.models.grantor_schema_table import GrantorSchemaTable
from sqlalchemy import UUID, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid

from src.db.models.lookup_models import LkMgmtResourceType, LkMgmtPrivilege
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

########################
# Specific Resources
# TODO - probably put these in a separate file?
########################

class MgmtInternalResourceUser(GrantorSchemaTable, TimestampMixin):
    __tablename__ = "mgmt_internal_resource_user"

    mgmt_internal_resource_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey(MgmtResource.mgmt_resource_id), primary_key=True, default=uuid.uuid4)
    resource: Mapped[MgmtResource] = relationship(MgmtResource)

class Department(GrantorSchemaTable, TimestampMixin):
    __tablename__ = "department"

    department_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey(MgmtResource.mgmt_resource_id), primary_key=True, default=uuid.uuid4)
    resource: Mapped[MgmtResource] = relationship(MgmtResource)

    department_name: Mapped[str]

class Subagency(GrantorSchemaTable, TimestampMixin):
    __tablename__ = "subagency"

    subagency_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey(MgmtResource.mgmt_resource_id), primary_key=True, default=uuid.uuid4)
    resource: Mapped[MgmtResource] = relationship(MgmtResource)

    subagency_name: Mapped[str]

    department_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey(Department.department_id))

class Team(GrantorSchemaTable, TimestampMixin):
    __tablename__ = "team"

    team_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey(MgmtResource.mgmt_resource_id), primary_key=True, default=uuid.uuid4)
    resource: Mapped[MgmtResource] = relationship(MgmtResource)

    team_name: Mapped[str]

    subagency_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey(Subagency.subagency_id))

########################
# Role / authZ related tables
########################

class MgmtResourceUser(GrantorSchemaTable, TimestampMixin):
    __tablename__ = "mgmt_resource_user"

    mgmt_resource_user_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)

    mgmt_resource_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey(MgmtResource.mgmt_resource_id))
    mgmt_resource: Mapped[MgmtResource] = relationship(MgmtResource)

    mgmt_user_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey(MgmtUser.mgmt_user_id))
    mgmt_user: Mapped[MgmtUser] = relationship(MgmtUser)

    roles: Mapped[list[MgmtResourceUserRole]] = relationship(
        back_populates="mgmt_resource_user",
        uselist=True,
        cascade="all, delete-orphan",
        lazy="selectin"  # preload roles
    )


class MgmtRole(GrantorSchemaTable, TimestampMixin):
    __tablename__ = "mgmt_role"

    mgmt_role_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    role_name: Mapped[str]
    is_core: Mapped[bool] = mapped_column(default=False)

    link_privileges: Mapped[list[MgmtLinkRolePrivilege]] = relationship(
        back_populates="mgmt_role_privilege",
        uselist=True,
        cascade="all, delete-orphan",
        lazy="selectin" # always load the privileges
    )

    link_role_resource_type: Mapped[list[MgmtLinkRoleResourceType]] = relationship(
        back_populates="mgmt_role_resource_type",
        uselist=True,
        cascade="all, delete-orphan",
        lazy="selectin" # Preload resource types
    )

    privileges: AssociationProxy[set[MgmtPrivilege]] = association_proxy(
        "link_privileges",
        "mgmt_privilege",
        creator=lambda obj: MgmtLinkRolePrivilege(mgmt_privilege=obj)
    )

    resource_types: Mapped[list[MgmtResourceType]] = association_proxy(
        "link_role_resource_types",
        "mgmt_resource_type",
        creator=lambda obj: MgmtLinkRoleResourceType(mgmt_resource_type=obj)
    )

class MgmtResourceUserRole(GrantorSchemaTable, TimestampMixin):
    __tablename__ = "mgmt_resource_user_role"

    mgmt_resource_user_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey(MgmtResourceUser.mgmt_resource_user_id), primary_key=True)
    mgmt_resource_user: Mapped[MgmtResourceUser] = relationship(MgmtResourceUser)

    mgmt_role_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey(MgmtRole.mgmt_role_id), primary_key=True)
    mgmt_role: Mapped[MgmtRole] = relationship(MgmtRole, lazy="selectin") # always preload role


class MgmtLinkRolePrivilege(GrantorSchemaTable, TimestampMixin):
    __tablename__ = "mgmt_link_role_privilege"

    mgmt_role_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey(MgmtRole.mgmt_role_id), primary_key=True)
    mgmt_role: Mapped[MgmtRole] = relationship(MgmtRole)

    mgmt_privilege: Mapped[MgmtPrivilege] = mapped_column(
        "mgmt_privilege_id",
        LookupColumn(LkMgmtPrivilege),
        ForeignKey(LkMgmtPrivilege.mgmt_privilege_id),
        lazy="selectin",
    )

class MgmtLinkRoleResourceType(GrantorSchemaTable, TimestampMixin):
    __tablename__ = "mgmt_link_role_resource_type"

    mgmt_role_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey(MgmtRole.mgmt_role_id), primary_key=True)
    mgmt_role: Mapped[MgmtRole] = relationship(MgmtRole)

    mgmt_resource_type: Mapped[MgmtResourceType] = mapped_column(
        "mgmt_resource_type_id",
        LookupColumn(LkMgmtResourceType),
        ForeignKey(LkMgmtResourceType.mgmt_resource_type_id),
    )