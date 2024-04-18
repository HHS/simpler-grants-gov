#
# SQLAlchemy models for foreign tables.
#

import datetime

from sqlalchemy.orm import Mapped, mapped_column

from . import base


class Tsynopsis(base.Base):
    __tablename__ = "tsynopsis"

    version_nbr: Mapped[int | None]
    unarchive_date: Mapped[datetime.datetime | None]
    syn_desc: Mapped[str | None]
    sendmail: Mapped[str | None]
    response_date_desc: Mapped[str | None]
    response_date: Mapped[datetime.datetime | None]
    publisher_profile_id: Mapped[int | None]
    publisheruid: Mapped[str | None]
    posting_date: Mapped[datetime.datetime | None]
    oth_cat_fa_desc: Mapped[str | None]
    opportunity_id: Mapped[int] = mapped_column(primary_key=True)
    number_of_awards: Mapped[str | None]
    modification_comments: Mapped[str | None]
    last_upd_id: Mapped[str | None]
    last_upd_date: Mapped[datetime.datetime | None]
    fd_link_url: Mapped[str | None]
    fd_link_desc: Mapped[str | None]
    est_funding: Mapped[str | None]
    creator_id: Mapped[str | None]
    create_ts: Mapped[datetime.datetime]
    created_date: Mapped[datetime.datetime | None]
    cost_sharing: Mapped[str | None]
    a_sa_code: Mapped[str | None]
    award_floor: Mapped[str | None]
    award_ceiling: Mapped[str | None]
    archive_date: Mapped[datetime.datetime | None]
    applicant_elig_desc: Mapped[str | None]
    agency_phone: Mapped[str | None]
    agency_name: Mapped[str | None]
    agency_contact_desc: Mapped[str | None]
    agency_addr_desc: Mapped[str | None]
    ac_phone_number: Mapped[str | None]
    ac_name: Mapped[str | None]
    ac_email_desc: Mapped[str | None]
    ac_email_addr: Mapped[str | None]


class TsynopsisHist(base.Base):
    __tablename__ = "tsynopsis_hist"

    version_nbr: Mapped[int]
    unarchive_date: Mapped[datetime.datetime | None]
    syn_desc: Mapped[str | None]
    sendmail: Mapped[str | None]
    revision_number: Mapped[int] = mapped_column(primary_key=True)
    response_date_desc: Mapped[str | None]
    response_date: Mapped[datetime.datetime | None]
    publisher_profile_id: Mapped[int | None]
    publisheruid: Mapped[str | None]
    posting_date: Mapped[datetime.datetime | None]
    oth_cat_fa_desc: Mapped[str | None]
    opportunity_id: Mapped[int] = mapped_column(primary_key=True)
    number_of_awards: Mapped[str | None]
    modification_comments: Mapped[str | None]
    last_upd_id: Mapped[str | None]
    last_upd_date: Mapped[datetime.datetime | None]
    fd_link_url: Mapped[str | None]
    fd_link_desc: Mapped[str | None]
    est_funding: Mapped[str | None]
    creator_id: Mapped[str | None]
    create_ts: Mapped[datetime.datetime]
    created_date: Mapped[datetime.datetime | None]
    cost_sharing: Mapped[str | None]
    a_sa_code: Mapped[str | None]
    award_floor: Mapped[str | None]
    award_ceiling: Mapped[str | None]
    archive_date: Mapped[datetime.datetime | None]
    applicant_elig_desc: Mapped[str | None]
    agency_phone: Mapped[str | None]
    agency_name: Mapped[str | None]
    agency_contact_desc: Mapped[str | None]
    agency_addr_desc: Mapped[str | None]
    ac_phone_number: Mapped[str | None]
    ac_name: Mapped[str | None]
    ac_email_desc: Mapped[str | None]
    ac_email_addr: Mapped[str | None]
    action_type: Mapped[str | None]
    action_date: Mapped[datetime.datetime | None]


class TapplicanttypesSynopsis(base.Base):
    __tablename__ = "tapplicanttypes_synopsis"

    opportunity_id: Mapped[int | None] = mapped_column(primary_key=True)
    last_upd_id: Mapped[str | None]
    last_upd_date: Mapped[datetime.datetime | None]
    creator_id: Mapped[str | None]
    created_date: Mapped[datetime.datetime | None]
    at_syn_id: Mapped[int] = mapped_column(primary_key=True)
    at_id: Mapped[str | None] = mapped_column(primary_key=True)


class TapplicanttypesSynopsisHist(base.Base):
    __tablename__ = "tapplicanttypes_synopsis_hist"

    revision_number: Mapped[int] = mapped_column(primary_key=True)
    opportunity_id: Mapped[int] = mapped_column(primary_key=True)
    last_upd_id: Mapped[str | None]
    last_upd_date: Mapped[datetime.datetime | None]
    creator_id: Mapped[str | None]
    created_date: Mapped[datetime.datetime | None]
    at_syn_id: Mapped[int] = mapped_column(primary_key=True)
    at_id: Mapped[str] = mapped_column(primary_key=True)


class TfundactcatSynopsis(base.Base):
    __tablename__ = "tfundactcat_synopsis"

    opportunity_id: Mapped[int | None] = mapped_column(primary_key=True)
    last_upd_id: Mapped[str | None]
    last_upd_date: Mapped[datetime.datetime | None]
    fac_syn_id: Mapped[int] = mapped_column(primary_key=True)
    fac_id: Mapped[str | None] = mapped_column(primary_key=True)
    creator_id: Mapped[str | None]
    created_date: Mapped[datetime.datetime | None]


class TfundactcatSynopsisHist(base.Base):
    __tablename__ = "tfundactcat_synopsis_hist"

    revision_number: Mapped[int] = mapped_column(primary_key=True)
    opportunity_id: Mapped[int] = mapped_column(primary_key=True)
    last_upd_id: Mapped[str | None]
    last_upd_date: Mapped[datetime.datetime | None]
    fac_syn_id: Mapped[int] = mapped_column(primary_key=True)
    fac_id: Mapped[str] = mapped_column(primary_key=True)
    creator_id: Mapped[str | None]
    created_date: Mapped[datetime.datetime | None]


class TfundinstrSynopsis(base.Base):
    __tablename__ = "tfundinstr_synopsis"

    opportunity_id: Mapped[int | None] = mapped_column(primary_key=True)
    last_upd_id: Mapped[str | None]
    last_upd_date: Mapped[datetime.datetime | None]
    fi_syn_id: Mapped[int] = mapped_column(primary_key=True)
    fi_id: Mapped[str | None] = mapped_column(primary_key=True)
    creator_id: Mapped[str | None]
    created_date: Mapped[datetime.datetime | None]


class TfundinstrSynopsisHist(base.Base):
    __tablename__ = "tfundinstr_synopsis_hist"

    revision_number: Mapped[int] = mapped_column(primary_key=True)
    opportunity_id: Mapped[int] = mapped_column(primary_key=True)
    last_upd_id: Mapped[str | None]
    last_upd_date: Mapped[datetime.datetime | None]
    fi_syn_id: Mapped[int] = mapped_column(primary_key=True)
    fi_id: Mapped[str] = mapped_column(primary_key=True)
    creator_id: Mapped[str | None]
    created_date: Mapped[datetime.datetime | None]
