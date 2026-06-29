"""Abstract base models describing the shape of the tables the auth layer relies on.

These declare only the columns the generic authN logic needs to read or write. The
concrete tables (see ``user_models.py``) inherit from these and supply the
application-specific details (foreign keys, relationships, additional columns).

Keeping the auth logic typed against these abstract bases lets us share that logic
without it referencing the concrete API tables directly.
"""

import uuid
from datetime import datetime

from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from grants_shared.db.models.base import Base


class BaseUser(Base):
    __abstract__ = True

    user_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)


class BaseUserTokenSession(Base):
    __abstract__ = True

    # The concrete table redeclares this with a ForeignKey to the user table.
    user_id: Mapped[uuid.UUID] = mapped_column(primary_key=True)

    token_id: Mapped[uuid.UUID] = mapped_column(primary_key=True)

    expires_at: Mapped[datetime]

    # When a user logs out, we set this flag to False.
    is_valid: Mapped[bool] = mapped_column(default=True)


class BaseUserApiKey(Base):
    __abstract__ = True

    api_key_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    key_name: Mapped[str]
    key_id: Mapped[str] = mapped_column(
        unique=True, index=True, comment="AWS API Gateway key identifier"
    )
    # The concrete table redeclares this with a ForeignKey to the user table.
    user_id: Mapped[uuid.UUID] = mapped_column(index=True)
    last_used: Mapped[datetime | None]
    is_active: Mapped[bool] = mapped_column(default=True)


class BaseLoginGovState(Base):
    __abstract__ = True

    login_gov_state_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True)

    # https://openid.net/specs/openid-connect-core-1_0.html#NonceNotes
    nonce: Mapped[uuid.UUID]


class BaseLinkExternalUser(Base):
    __abstract__ = True

    external_user_id: Mapped[str] = mapped_column(index=True, unique=True)

    # The concrete table redeclares this with a ForeignKey to the user table.
    user_id: Mapped[uuid.UUID] = mapped_column(index=True)

    email: Mapped[str] = mapped_column(index=True)
