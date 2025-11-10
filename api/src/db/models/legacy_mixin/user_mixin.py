from datetime import datetime

from sqlalchemy import BigInteger
from sqlalchemy.orm import Mapped, declarative_mixin, mapped_column


@declarative_mixin
class TuserAccountMapperMixin:
    user_account_id: Mapped[int] = mapped_column(primary_key=True)
    ext_user_id: Mapped[str]
    ext_issuer: Mapped[str]
    ext_subject: Mapped[str | None]
    last_auth_date: Mapped[datetime]
    created_date: Mapped[datetime | None]
    creator_id: Mapped[str | None]
    last_upd_date: Mapped[datetime | None]
    last_upd_id: Mapped[str | None]
    source_type: Mapped[str] = mapped_column(primary_key=True)


@declarative_mixin
class TuserAccountMixin:
    user_account_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str]
    full_name: Mapped[str | None]
    email_address: Mapped[str | None]
    phone_number: Mapped[str | None]
    first_name: Mapped[str | None]
    middle_name: Mapped[str | None]
    last_name: Mapped[str | None]
    is_deleted_legacy: Mapped[str]
    is_duplicate: Mapped[str]
    is_active: Mapped[str]
    created_date: Mapped[datetime | None]
    creator_id: Mapped[str | None]
    last_upd_date: Mapped[datetime | None]
    last_upd_id: Mapped[str | None]
    is_email_confirm_pending: Mapped[str | None]
    deactivated_date: Mapped[datetime | None]
    mobile_number: Mapped[str | None]


@declarative_mixin
class TsubscriptionMixin:
    subscription_id: Mapped[int] = mapped_column(primary_key=True)
    user_account_id: Mapped[int | None]
    newsletters: Mapped[str | None]
    alerts: Mapped[str | None]
    all_new_opps: Mapped[str | None]
    opportunities: Mapped[str | None]
    saved_searches: Mapped[str | None]
    created_date: Mapped[datetime] = mapped_column(nullable=False)
    creator_id: Mapped[str] = mapped_column(nullable=False)
    last_upd_date: Mapped[datetime] = mapped_column(nullable=False)
    last_upd_id: Mapped[str] = mapped_column(nullable=False)


@declarative_mixin
class TsubscriptionSearchMixin:
    subscription_search_id: Mapped[int] = mapped_column(primary_key=True)
    subscription_id: Mapped[int | None]
    search_name: Mapped[str | None]
    search_params: Mapped[str | None]
    created_date: Mapped[datetime] = mapped_column(nullable=False)
    creator_id: Mapped[str] = mapped_column(nullable=False)
    last_upd_date: Mapped[datetime] = mapped_column(nullable=False)
    last_upd_id: Mapped[str] = mapped_column(nullable=False)


@declarative_mixin
class TsubscriptionOpportunityMixin:
    subscription_opportunity_id: Mapped[int] = mapped_column(primary_key=True)
    subscription_id: Mapped[int | None]
    opportunity_id: Mapped[int | None]
    is_opp_deleted: Mapped[str | None]
    created_date: Mapped[datetime] = mapped_column(nullable=False)
    creator_id: Mapped[str] = mapped_column(nullable=False)
    last_upd_date: Mapped[datetime] = mapped_column(nullable=False)
    last_upd_id: Mapped[str] = mapped_column(nullable=False)


@declarative_mixin
class VuserAccountMixin:
    user_account_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[str]
    email: Mapped[str]
    first_name: Mapped[str]
    last_name: Mapped[str]
    full_name: Mapped[str]
    is_active: Mapped[str]
    is_deleted_legacy: Mapped[str]
    is_duplicate: Mapped[str]
    created_date: Mapped[datetime] = mapped_column(nullable=False)
    last_upd_date: Mapped[datetime] = mapped_column(nullable=False)


@declarative_mixin
class TuserProfileMixin:
    user_profile_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_account_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    profile_duns: Mapped[str]
    profile_type_id: Mapped[int]
    profile_name: Mapped[str]
    title: Mapped[str]
    is_ebiz_poc: Mapped[str]
    is_deleted_legacy: Mapped[str]
    created_date: Mapped[datetime] = mapped_column(nullable=False)
    last_upd_date: Mapped[datetime] = mapped_column(nullable=False)
