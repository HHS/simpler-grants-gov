from datetime import date, datetime

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
class VuserAccountMixin:
    user_account_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str]
    full_name: Mapped[str | None]
    email: Mapped[str | None]
    phone_number: Mapped[str | None]
    first_name: Mapped[str | None]
    middle_name: Mapped[str | None]
    last_name: Mapped[str | None]
    is_deleted_legacy: Mapped[str]
    is_duplicate: Mapped[str]
    is_active: Mapped[str]
    is_email_confirm_pending: Mapped[str | None]
    deactivated_date: Mapped[date | None]
    mobile_number: Mapped[str | None]
    created_date: Mapped[datetime | None]
    creator_id: Mapped[str | None]
    last_upd_date: Mapped[datetime | None]
    last_upd_id: Mapped[str | None]


@declarative_mixin
class TuserProfileMixin:
    user_profile_id: Mapped[int] = mapped_column(primary_key=True)
    profile_name: Mapped[str | None]
    profile_duns: Mapped[str | None]
    profile_agency_code: Mapped[str | None]
    title: Mapped[str | None]
    is_ebiz_poc: Mapped[str | None]
    is_validate_mpin: Mapped[str | None]
    is_hidden: Mapped[str | None]
    is_deleted_legacy: Mapped[str | None]
    is_default: Mapped[str | None]
    email_preference: Mapped[str | None]
    profile_type_id: Mapped[int]
    user_account_id: Mapped[int]
    created_date: Mapped[datetime | None]
    creator_id: Mapped[str | None]
    last_upd_date: Mapped[datetime | None]
    last_upd_id: Mapped[str | None]
