"""Abstract base models describing the shape of the tables the auth layer relies on.

These declare only the columns the generic authN logic needs to read or write. The
concrete tables (see ``user_models.py``) inherit from these and supply the
application-specific details (foreign keys, relationships, additional columns).

Keeping the auth logic typed against these abstract bases lets us share that logic
without it referencing the concrete API tables directly.
"""

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy.orm import Mapped, mapped_column

from grants_shared.db.models.base import Base


class BaseUser(Base):
    __abstract__ = True

    def get_user_id(self) -> uuid.UUID:
        """Get the user ID (ie. primary key) for this user. Does not need the primary key to be named
        exactly user_id in the derived table, but does assume that the user doesn't have a multi-column primary key.

        Mainly used as a convenience in our authN logic which wants to put an ID in the JWTs we generate.
        """
        primary_key = self.get_primary_key_value()
        if len(primary_key) != 1:
            raise Exception("Unexpected number of primary keys for user, expected exactly 1")

        return primary_key[0]

    def get_log_extra(self) -> dict[str, Any]:
        """Get logging info, do not include anything secretive in this function - extend it in derived classes to add more"""
        return {"auth.user_id": self.get_user_id()}


class BaseUserTokenSession(Base):
    __abstract__ = True

    token_id: Mapped[uuid.UUID] = mapped_column(primary_key=True)

    expires_at: Mapped[datetime]

    # When a user logs out, we set this flag to False.
    is_valid: Mapped[bool] = mapped_column(default=True)

    def get_log_extra(self) -> dict[str, Any]:
        """Get logging info, do not include anything secretive in this function - extend it in derived classes to add more"""
        return {
            "auth.token_id": self.token_id,
            "auth.expires_at": self.expires_at,
        }


class BaseUserApiKey(Base):
    __abstract__ = True

    key_name: Mapped[str]
    key_id: Mapped[str] = mapped_column(
        unique=True, index=True, comment="AWS API Gateway key identifier"
    )
    last_used: Mapped[datetime | None]
    is_active: Mapped[bool] = mapped_column(default=True)


class BaseLoginGovState(Base):
    __abstract__ = True

    # https://openid.net/specs/openid-connect-core-1_0.html#NonceNotes
    nonce: Mapped[uuid.UUID]


class BaseLinkExternalUser(Base):
    __abstract__ = True

    external_user_id: Mapped[str] = mapped_column(index=True, unique=True)

    email: Mapped[str] = mapped_column(index=True)
