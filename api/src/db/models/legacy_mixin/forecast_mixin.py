#
# SQLAlchemy models for foreign tables.
#
# The order of the columns must match the remote Oracle database. The names are not required to
# match by oracle_fdw, but we are matching them for maintainability.
#

import datetime

from sqlalchemy.orm import Mapped, declarative_mixin, mapped_column


@declarative_mixin
class TforecastMixin:
    opportunity_id: Mapped[int] = mapped_column(primary_key=True)
    version_nbr: Mapped[int]
    posting_date: Mapped[datetime.datetime | None]
    archive_date: Mapped[datetime.datetime | None]
    forecast_desc: Mapped[str | None]
    oth_cat_fa_desc: Mapped[str | None]
    cost_sharing: Mapped[str | None]
    number_of_awards: Mapped[str | None]
    est_funding: Mapped[str | None]
    award_ceiling: Mapped[str | None]
    award_floor: Mapped[str | None]
    fd_link_url: Mapped[str | None]
    fd_link_desc: Mapped[str | None]
    ac_name: Mapped[str | None]
    ac_phone: Mapped[str | None]
    ac_email_addr: Mapped[str | None]
    ac_email_desc: Mapped[str | None]
    agency_code: Mapped[str | None]
    sendmail: Mapped[str | None]
    applicant_elig_desc: Mapped[str | None]
    est_synopsis_posting_date: Mapped[datetime.datetime | None]
    est_appl_response_date: Mapped[datetime.datetime | None]
    est_appl_response_date_desc: Mapped[str | None]
    est_award_date: Mapped[datetime.datetime | None]
    est_project_start_date: Mapped[datetime.datetime | None]
    fiscal_year: Mapped[int | None]
    modification_comments: Mapped[str | None]
    create_ts: Mapped[datetime.datetime]
    created_date: Mapped[datetime.datetime | None]
    last_upd_date: Mapped[datetime.datetime | None]
    creator_id: Mapped[str | None]
    last_upd_id: Mapped[str | None]
    publisheruid: Mapped[str | None]
    publisher_profile_id: Mapped[int | None]


@declarative_mixin
class TforecastHistMixin:
    opportunity_id: Mapped[int] = mapped_column(primary_key=True)
    revision_number: Mapped[int] = mapped_column(primary_key=True)
    version_nbr: Mapped[int]
    posting_date: Mapped[datetime.datetime | None]
    archive_date: Mapped[datetime.datetime | None]
    forecast_desc: Mapped[str | None]
    oth_cat_fa_desc: Mapped[str | None]
    cost_sharing: Mapped[str | None]
    number_of_awards: Mapped[str | None]
    est_funding: Mapped[str | None]
    award_ceiling: Mapped[str | None]
    award_floor: Mapped[str | None]
    fd_link_url: Mapped[str | None]
    fd_link_desc: Mapped[str | None]
    ac_name: Mapped[str | None]
    ac_phone: Mapped[str | None]
    ac_email_addr: Mapped[str | None]
    ac_email_desc: Mapped[str | None]
    agency_code: Mapped[str | None]
    sendmail: Mapped[str | None]
    applicant_elig_desc: Mapped[str | None]
    est_synopsis_posting_date: Mapped[datetime.datetime | None]
    est_appl_response_date: Mapped[datetime.datetime | None]
    est_appl_response_date_desc: Mapped[str | None]
    est_award_date: Mapped[datetime.datetime | None]
    est_project_start_date: Mapped[datetime.datetime | None]
    fiscal_year: Mapped[int | None]
    modification_comments: Mapped[str | None]
    action_type: Mapped[str | None]
    action_date: Mapped[datetime.datetime | None]
    create_ts: Mapped[datetime.datetime]
    created_date: Mapped[datetime.datetime | None]
    last_upd_date: Mapped[datetime.datetime | None]
    creator_id: Mapped[str | None]
    last_upd_id: Mapped[str | None]
    publisheruid: Mapped[str | None]
    publisher_profile_id: Mapped[int | None]


@declarative_mixin
class TapplicanttypesForecastMixin:
    at_frcst_id: Mapped[int] = mapped_column(primary_key=True)
    at_id: Mapped[str] = mapped_column(primary_key=True)
    opportunity_id: Mapped[int] = mapped_column(primary_key=True)
    created_date: Mapped[datetime.datetime | None]
    last_upd_date: Mapped[datetime.datetime | None]
    creator_id: Mapped[str | None]
    last_upd_id: Mapped[str | None]


@declarative_mixin
class TapplicanttypesForecastHistMixin:
    at_frcst_id: Mapped[int] = mapped_column(primary_key=True)
    at_id: Mapped[str] = mapped_column(primary_key=True)
    opportunity_id: Mapped[int] = mapped_column(primary_key=True)
    revision_number: Mapped[int] = mapped_column(primary_key=True)
    created_date: Mapped[datetime.datetime | None]
    last_upd_date: Mapped[datetime.datetime | None]
    creator_id: Mapped[str | None]
    last_upd_id: Mapped[str | None]


@declarative_mixin
class TfundactcatForecastMixin:
    fac_frcst_id: Mapped[int] = mapped_column(primary_key=True)
    fac_id: Mapped[str] = mapped_column(primary_key=True)
    opportunity_id: Mapped[int] = mapped_column(primary_key=True)
    created_date: Mapped[datetime.datetime | None]
    last_upd_date: Mapped[datetime.datetime | None]
    creator_id: Mapped[str | None]
    last_upd_id: Mapped[str | None]


@declarative_mixin
class TfundactcatForecastHistMixin:
    fac_frcst_id: Mapped[int] = mapped_column(primary_key=True)
    fac_id: Mapped[str] = mapped_column(primary_key=True)
    opportunity_id: Mapped[int] = mapped_column(primary_key=True)
    revision_number: Mapped[int] = mapped_column(primary_key=True)
    created_date: Mapped[datetime.datetime | None]
    last_upd_date: Mapped[datetime.datetime | None]
    creator_id: Mapped[str | None]
    last_upd_id: Mapped[str | None]


@declarative_mixin
class TfundinstrForecastMixin:
    fi_frcst_id: Mapped[int] = mapped_column(primary_key=True)
    fi_id: Mapped[str] = mapped_column(primary_key=True)
    opportunity_id: Mapped[int] = mapped_column(primary_key=True)
    created_date: Mapped[datetime.datetime | None]
    last_upd_date: Mapped[datetime.datetime | None]
    creator_id: Mapped[str | None]
    last_upd_id: Mapped[str | None]


@declarative_mixin
class TfundinstrForecastHistMixin:
    fi_frcst_id: Mapped[int] = mapped_column(primary_key=True)
    fi_id: Mapped[str] = mapped_column(primary_key=True)
    opportunity_id: Mapped[int] = mapped_column(primary_key=True)
    revision_number: Mapped[int] = mapped_column(primary_key=True)
    created_date: Mapped[datetime.datetime | None]
    last_upd_date: Mapped[datetime.datetime | None]
    creator_id: Mapped[str | None]
    last_upd_id: Mapped[str | None]
