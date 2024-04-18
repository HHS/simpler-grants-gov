#
# SQLAlchemy models for foreign tables.
#

import datetime

import sqlalchemy
from sqlalchemy.orm import Mapped, mapped_column

from . import base


class Tforecast(base.Base):
    __tablename__ = "tforecast"

    version_nbr: Mapped[int]
    sendmail: Mapped[str | None]
    publisher_profile_id: Mapped[int | None]
    publisheruid: Mapped[str | None]
    posting_date: Mapped[datetime.datetime | None]
    oth_cat_fa_desc: Mapped[str | None]
    opportunity_id: Mapped[int] = mapped_column(primary_key=True)
    number_of_awards: Mapped[str | None]
    modification_comments: Mapped[str | None]
    last_upd_id: Mapped[str | None]
    last_upd_date: Mapped[datetime.datetime | None]
    forecast_desc: Mapped[str | None]
    fiscal_year: Mapped[int | None]
    fd_link_url: Mapped[str | None]
    fd_link_desc: Mapped[str | None]
    est_synopsis_posting_date: Mapped[datetime.datetime | None]
    est_project_start_date: Mapped[datetime.datetime | None]
    est_funding: Mapped[str | None]
    est_award_date: Mapped[datetime.datetime | None]
    est_appl_response_date_desc: Mapped[str | None]
    est_appl_response_date: Mapped[datetime.datetime | None]
    creator_id: Mapped[str | None]
    create_ts: Mapped[datetime.datetime]
    created_date: Mapped[datetime.datetime | None]
    cost_sharing: Mapped[str | None]
    award_floor: Mapped[str | None]
    award_ceiling: Mapped[str | None]
    archive_date: Mapped[datetime.datetime | None]
    applicant_elig_desc: Mapped[str | None]
    agency_code: Mapped[str | None]
    ac_phone: Mapped[str | None]
    ac_name: Mapped[str | None]
    ac_email_desc: Mapped[str | None]
    ac_email_addr: Mapped[str | None]


class TforecastHist(base.Base):
    __tablename__ = "tforecast_hist"

    created_date: Mapped[datetime.datetime | None]
    cost_sharing: Mapped[str | None]
    award_floor: Mapped[str | None]
    award_ceiling: Mapped[str | None]
    archive_date: Mapped[datetime.datetime | None]
    applicant_elig_desc: Mapped[str | None]
    agency_code: Mapped[str | None]
    ac_phone: Mapped[str | None]
    ac_name: Mapped[str | None]
    ac_email_desc: Mapped[str | None]
    ac_email_addr: Mapped[str | None]
    action_type: Mapped[str | None]
    action_date: Mapped[datetime.datetime | None]
    version_nbr: Mapped[int]
    sendmail: Mapped[str | None]
    revision_number: Mapped[int] = mapped_column(primary_key=True)
    publisher_profile_id: Mapped[int | None]
    publisheruid: Mapped[str | None]
    posting_date: Mapped[datetime.datetime | None]
    oth_cat_fa_desc: Mapped[str | None]
    opportunity_id: Mapped[int] = mapped_column(primary_key=True)
    number_of_awards: Mapped[str | None]
    modification_comments: Mapped[str | None]
    last_upd_id: Mapped[str | None]
    last_upd_date: Mapped[datetime.datetime | None]
    forecast_desc: Mapped[str | None]
    fiscal_year: Mapped[int | None]
    fd_link_url: Mapped[str | None]
    fd_link_desc: Mapped[str | None]
    est_synopsis_posting_date: Mapped[datetime.datetime | None]
    est_project_start_date: Mapped[datetime.datetime | None]
    est_funding: Mapped[str | None]
    est_award_date: Mapped[datetime.datetime | None]
    est_appl_response_date_desc: Mapped[str | None]
    est_appl_response_date: Mapped[datetime.datetime | None]
    creator_id: Mapped[str | None]
    create_ts: Mapped[datetime.datetime]


class TapplicanttypesForecast(base.Base):
    __tablename__ = "tapplicanttypes_forecast"

    opportunity_id: Mapped[int | None] = mapped_column(primary_key=True)
    last_upd_id: Mapped[str | None]
    last_upd_date: Mapped[datetime.datetime | None]
    creator_id: Mapped[str | None]
    created_date: Mapped[datetime.datetime | None]
    at_id: Mapped[str | None] = mapped_column(primary_key=True)
    at_frcst_id: Mapped[int] = mapped_column(primary_key=True)


class TapplicanttypesForecastHist(base.Base):
    __tablename__ = "tapplicanttypes_forecast_hist"

    revision_number: Mapped[int] = mapped_column(primary_key=True)
    opportunity_id: Mapped[int | None] = mapped_column(primary_key=True)
    last_upd_id: Mapped[str | None]
    last_upd_date: Mapped[datetime.datetime | None]
    creator_id: Mapped[str | None]
    created_date: Mapped[datetime.datetime | None]
    at_id: Mapped[str | None] = mapped_column(primary_key=True)
    at_frcst_id: Mapped[int] = mapped_column(primary_key=True)


class TfundactcatForecast(base.Base):
    __tablename__ = "tfundactcat_forecast"

    opportunity_id: Mapped[int | None] = mapped_column(primary_key=True)
    last_upd_id: Mapped[str | None]
    last_upd_date: Mapped[datetime.datetime | None]
    fac_id: Mapped[str | None] = mapped_column(primary_key=True)
    fac_frcst_id: Mapped[int] = mapped_column(primary_key=True)
    creator_id: Mapped[str | None]
    created_date: Mapped[datetime.datetime | None]


class TfundactcatForecastHist(base.Base):
    __tablename__ = "tfundactcat_forecast_hist"

    revision_number: Mapped[int] = mapped_column(primary_key=True)
    opportunity_id: Mapped[int | None] = mapped_column(primary_key=True)
    last_upd_id: Mapped[str | None]
    last_upd_date: Mapped[datetime.datetime | None]
    fac_id: Mapped[str | None] = mapped_column(primary_key=True)
    fac_frcst_id: Mapped[int] = mapped_column(primary_key=True)
    creator_id: Mapped[str | None]
    created_date: Mapped[datetime.datetime | None]


class TfundinstrForecast(base.Base):
    __tablename__ = "tfundinstr_forecast"

    opportunity_id: Mapped[int | None] = mapped_column(primary_key=True)
    last_upd_id: Mapped[str | None]
    last_upd_date: Mapped[datetime.datetime | None]
    fi_id: Mapped[str | None] = mapped_column(primary_key=True)
    fi_frcst_id: Mapped[int] = mapped_column(primary_key=True)
    creator_id: Mapped[str | None]
    created_date: Mapped[datetime.datetime | None]


class TfundinstrForecastHist(base.Base):
    __tablename__ = "tfundinstr_forecast_hist"

    revision_number: Mapped[int] = mapped_column(primary_key=True)
    opportunity_id: Mapped[int | None] = mapped_column(primary_key=True)
    last_upd_id: Mapped[str | None]
    last_upd_date: Mapped[datetime.datetime | None]
    fi_id: Mapped[str | None] = mapped_column(primary_key=True)
    fi_frcst_id: Mapped[int] = mapped_column(primary_key=True)
    creator_id: Mapped[str | None]
    created_date: Mapped[datetime.datetime | None]
