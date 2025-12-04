#
# SQLAlchemy models for foreign tables.
#
# The order of the columns must match the remote Oracle database. The names are not required to
# match by oracle_fdw, but we are matching them for maintainability.
from sqlalchemy import Index

from src.db.models.legacy_mixin import user_mixin
from src.db.models.legacy_mixin.user_mixin import TuserProfileMixin, VuserAccountMixin
from src.db.models.staging.staging_base import StagingBase, StagingParamMixin


# TODO(#7340): Evaluate removing TuserAccount/TuserAccountMapper - no longer synced from Oracle
class TuserAccountMapper(StagingBase, user_mixin.TuserAccountMapperMixin, StagingParamMixin):
    __tablename__ = "tuser_account_mapper"


# TODO(#7340): Evaluate removing TuserAccount/TuserAccountMapper - no longer synced from Oracle
class TuserAccount(StagingBase, user_mixin.TuserAccountMixin, StagingParamMixin):
    __tablename__ = "tuser_account"


class TsubscriptionMixin(StagingBase, user_mixin.TsubscriptionMixin, StagingParamMixin):
    __tablename__ = "tsubscription"


class TsubscriptionSearchMixin(StagingBase, user_mixin.TsubscriptionSearchMixin, StagingParamMixin):
    __tablename__ = "tsubscription_search"


class TsubscriptionOpportunityMixin(
    StagingBase, user_mixin.TsubscriptionOpportunityMixin, StagingParamMixin
):
    __tablename__ = "tsubscription_opportunity"


class VuserAccount(StagingBase, VuserAccountMixin, StagingParamMixin):
    __tablename__ = "vuser_account"

    __table_args__ = (
        # Indexes for query performance
        Index("ix_v_user_account_email", "email"),
        Index("ix_v_user_account_is_active", "is_active"),
        Index("ix_v_user_account_is_deleted_legacy", "is_deleted_legacy"),
        # Must include parent __table_args__ to inherit schema setting
        # Without this, Alembic will recreate the entire table
        StagingBase.__table_args__,
    )  # type: ignore[assignment]


class TuserProfile(StagingBase, TuserProfileMixin, StagingParamMixin):
    __tablename__ = "tuser_profile"

    __table_args__ = (
        # Indexes for query performance
        Index("ix_tuser_profile_user_account_id", "user_account_id"),
        Index("ix_tuser_profile_profile_duns", "profile_duns"),
        Index("ix_tuser_profile_profile_type_id", "profile_type_id"),
        Index("ix_tuser_profile_is_deleted_legacy", "is_deleted_legacy"),
        # Must include parent __table_args__ to inherit schema setting
        StagingBase.__table_args__,
    )  # type: ignore[assignment]
