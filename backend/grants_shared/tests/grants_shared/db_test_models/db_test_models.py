import uuid
from enum import StrEnum
from typing import Any

from sqlalchemy import UUID, ForeignKey, and_
from sqlalchemy.ext.associationproxy import AssociationProxy, association_proxy
from sqlalchemy.orm import Mapped, mapped_column, relationship

from grants_shared.adapters.db.type_decorators.postgres_type_decorators import LookupColumn
from grants_shared.db.models.auth_base_models import (
    BaseLinkExternalUser,
    BaseLoginGovState,
    BaseUser,
    BaseUserTokenSession,
)
from grants_shared.db.models.base import Base, TimestampMixin
from grants_shared.db.models.lookup import (
    Lookup,
    LookupConfig,
    LookupRegistry,
    LookupStr,
    LookupTable,
)

# We don't have actual DB tables or DB migrations in grants_shared
# but want the ability to test DB interactions with tables. To do that
# we'll define SQLAlchemy models here.

################################
# Base tables
#
# Where the schemas for a given table are connected
################################


class GrantsSharedSchemaTable(Base):
    __abstract__ = True

    __table_args__: Any = {"schema": "grants_shared"}


class OtherSchemaTable(Base):
    __abstract__ = True

    __table_args__: Any = {"schema": "other"}


class BaseLookupTable(GrantsSharedSchemaTable, LookupTable):
    __abstract__ = True


################################
# Lookup Tables
################################


class ExampleType(StrEnum):
    ABSTRACT = "abstract"
    ANECDOTE = "anecdote"
    CASE_STUDY = "case_study"


EXAMPLE_TYPE_CONFIG: LookupConfig[ExampleType] = LookupConfig(
    [
        LookupStr(ExampleType.ABSTRACT, 1),
        LookupStr(ExampleType.ANECDOTE, 2),
        LookupStr(ExampleType.CASE_STUDY, 3),
    ]
)


class FriendType(StrEnum):
    BEST = "best"
    ACQUAINTANCE = "acquaintance"
    FRIEND_OF_FRIEND = "friend_of_friend"


FRIEND_TYPE_CONFIG: LookupConfig[FriendType] = LookupConfig(
    [
        LookupStr(FriendType.BEST, 1),
        LookupStr(FriendType.ACQUAINTANCE, 2),
        LookupStr(FriendType.FRIEND_OF_FRIEND, 3),
    ]
)


@LookupRegistry.register_lookup(EXAMPLE_TYPE_CONFIG)
class LkExampleType(BaseLookupTable, TimestampMixin):
    __tablename__ = "lk_example_type"

    example_type_id: Mapped[int] = mapped_column(primary_key=True)
    description: Mapped[str]

    @classmethod
    def from_lookup(cls, lookup: Lookup) -> LkExampleType:
        return LkExampleType(
            example_type_id=lookup.lookup_val, description=lookup.get_description()
        )


@LookupRegistry.register_lookup(FRIEND_TYPE_CONFIG)
class LkFriendType(BaseLookupTable, TimestampMixin):
    __tablename__ = "lk_friend_type"

    friend_type_id: Mapped[int] = mapped_column(primary_key=True)
    description: Mapped[str]

    @classmethod
    def from_lookup(cls, lookup: Lookup) -> LkFriendType:
        return LkFriendType(friend_type_id=lookup.lookup_val, description=lookup.get_description())


################################
# Implemented Tables
################################


class ExampleTable(GrantsSharedSchemaTable, TimestampMixin):
    __tablename__ = "example"

    example_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)

    description: Mapped[str]
    my_count: Mapped[int | None]

    example_type: Mapped[ExampleType | None] = mapped_column(
        "example_type_id",
        LookupColumn(LkExampleType),
        ForeignKey(LkExampleType.example_type_id),
    )

    friends: Mapped[list[FriendTable]] = relationship(
        back_populates="example", uselist=True, cascade="all, delete-orphan"
    )


class FriendTable(OtherSchemaTable, TimestampMixin):
    __tablename__ = "friend"

    friend_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)

    example_id: Mapped[uuid.UUID] = mapped_column(ForeignKey(ExampleTable.example_id))
    example: Mapped[ExampleTable] = relationship(ExampleTable)

    # Relationship link to the link_friend_type table
    link_friend_types: Mapped[list[LinkFriendType]] = relationship(
        back_populates="friend", uselist=True, cascade="all, delete-orphan"
    )
    # Create an association proxy for each of the link table relationships
    # https://docs.sqlalchemy.org/en/20/orm/extensions/associationproxy.html
    #
    # This lets us use these values as if they were just ordinary lists on a python
    # object. For example::
    #
    #   friend.friend_types.add(FRIEND_TYPE.BEST)
    #
    # will add a row to the link_friend_type table itself
    # and is still capable of using all of our column mapping code uneventfully.
    friend_types: AssociationProxy[set[FriendType]] = association_proxy(
        "link_friend_types",
        "friend_type",
        creator=lambda obj: LinkFriendType(friend_type=obj),
    )


class LinkFriendType(OtherSchemaTable, TimestampMixin):
    __tablename__ = "link_friend_type"

    friend_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(FriendTable.friend_id), primary_key=True
    )
    friend: Mapped[FriendTable] = relationship(FriendTable)

    friend_type: Mapped[FriendType] = mapped_column(
        "friend_type_id",
        LookupColumn(LkFriendType),
        ForeignKey(LkFriendType.friend_type_id),
        primary_key=True,
    )


class SharedUser(BaseUser, OtherSchemaTable, TimestampMixin):
    __tablename__ = "shared_user"

    shared_user_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)

    linked_login_gov_external_user: Mapped[SharedLinkExternalUser | None] = relationship(
        "SharedLinkExternalUser",
        primaryjoin=lambda: and_(
            SharedLinkExternalUser.shared_user_id == SharedUser.shared_user_id,
        ),
        uselist=False,
        viewonly=True,
    )

    @property
    def email(self) -> str | None:
        if self.linked_login_gov_external_user is not None:
            return self.linked_login_gov_external_user.email
        return None


class SharedLinkExternalUser(BaseLinkExternalUser, OtherSchemaTable, TimestampMixin):
    __tablename__ = "shared_link_external_user"

    link_external_user_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    shared_user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey(SharedUser.shared_user_id), index=True
    )
    shared_user: Mapped[SharedUser] = relationship(SharedUser)


class SharedUserTokenSession(BaseUserTokenSession, OtherSchemaTable, TimestampMixin):
    __tablename__ = "shared_user_token_session"

    shared_user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey(SharedUser.shared_user_id), primary_key=True
    )
    shared_user: Mapped[SharedUser] = relationship(SharedUser)


class SharedLoginGovState(BaseLoginGovState, OtherSchemaTable, TimestampMixin):
    """Table used to store temporary state during the OAuth login flow"""

    __tablename__ = "shared_login_gov_state"

    shared_login_gov_state_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True)
