import uuid

from sqlalchemy import ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.adapters.db.type_decorators.postgres_type_decorators import LookupColumn
from src.db.models.base import ApiSchemaTable, TimestampMixin
from src.db.models.lookup_models import LkExternalUserType


class User(ApiSchemaTable, TimestampMixin):
    __tablename__ = "user"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True)


class LinkExternalUser(ApiSchemaTable, TimestampMixin):
    __tablename__ = "link_external_user"

    link_external_user_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True)

    external_user_id: Mapped[str] = mapped_column(index=True, unique=True)

    user_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey(User.user_id), index=True)
    user: Mapped[User] = relationship(User)

    external_user_type: Mapped[int] = mapped_column(
        "external_user_type_id",
        LookupColumn(LkExternalUserType),
        ForeignKey(LkExternalUserType.external_user_type_id),
        index=True,
    )

    email: Mapped[str]

    first_name: Mapped[str]

    last_name: Mapped[str]
