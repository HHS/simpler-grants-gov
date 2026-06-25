import uuid

from grants_shared.adapters.db.type_decorators.postgres_type_decorators import LookupColumn
from grants_shared.db.models.base import TimestampMixin
from sqlalchemy import ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.constants.lookup_constants import UserType
from src.db.models.grantor_schema_table import GrantorSchemaTable
from src.db.models.lookup_models import LkUserType


class User(GrantorSchemaTable, TimestampMixin):
    # TODO - once we've moved the auth related functionality to grants_shared
    # change this to be derived from BaseUser
    __tablename__ = "user"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)

    user_type: Mapped[UserType | None] = mapped_column(
        "user_type_id",
        LookupColumn(LkUserType),
        ForeignKey(LkUserType.user_type_id),
        default=UserType.STANDARD,
    )