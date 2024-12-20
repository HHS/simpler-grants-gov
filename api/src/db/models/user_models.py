import uuid
from datetime import datetime

from sqlalchemy import BigInteger, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.adapters.db.type_decorators.postgres_type_decorators import LookupColumn
from src.constants.lookup_constants import ExternalUserType
from src.db.models.base import ApiSchemaTable, TimestampMixin
from src.db.models.lookup_models import LkExternalUserType
from src.db.models.opportunity_models import Opportunity


class User(ApiSchemaTable, TimestampMixin):
    __tablename__ = "user"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)


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

    email: Mapped[str]


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
    opportunity_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey(Opportunity.opportunity_id), primary_key=True
    )

    user: Mapped[User] = relationship(User)
