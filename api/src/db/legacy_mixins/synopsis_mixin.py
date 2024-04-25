#
# SQLAlchemy models for foreign tables.
#
# The order of the columns must match the remote Oracle database. The names are not required to
# match by oracle_fdw, but we are matching them for maintainability.
#

import datetime

from sqlalchemy.orm import Mapped, mapped_column, declarative_mixin

@declarative_mixin
class TsynopsisMixin:

    opportunity_id: Mapped[int] = mapped_column(primary_key=True)
    posting_date: Mapped[datetime.datetime | None]
    response_date: Mapped[datetime.datetime | None]
    archive_date: Mapped[datetime.datetime | None]
    unarchive_date: Mapped[datetime.datetime | None]
    syn_desc: Mapped[str | None]
    oth_cat_fa_desc: Mapped[str | None]
    agency_addr_desc: Mapped[str | None]
    cost_sharing: Mapped[str | None]
    number_of_awards: Mapped[str | None]
    est_funding: Mapped[str | None]
    award_ceiling: Mapped[str | None]
    award_floor: Mapped[str | None]
    fd_link_url: Mapped[str | None]
    fd_link_desc: Mapped[str | None]
    agency_contact_desc: Mapped[str | None]
    ac_email_addr: Mapped[str | None]
    ac_email_desc: Mapped[str | None]
    agency_name: Mapped[str | None]
    agency_phone: Mapped[str | None]
    a_sa_code: Mapped[str | None]
    ac_phone_number: Mapped[str | None]
    ac_name: Mapped[str | None]
    create_ts: Mapped[datetime.datetime]
    created_date: Mapped[datetime.datetime | None]
    last_upd_date: Mapped[datetime.datetime | None]
    creator_id: Mapped[str | None]
    last_upd_id: Mapped[str | None]
    sendmail: Mapped[str | None]
    response_date_desc: Mapped[str | None]
    applicant_elig_desc: Mapped[str | None]
    version_nbr: Mapped[int | None]
    modification_comments: Mapped[str | None]
    publisheruid: Mapped[str | None]
    publisher_profile_id: Mapped[int | None]

@declarative_mixin
class TsynopsisHistMixin:

    opportunity_id: Mapped[int] = mapped_column(primary_key=True)
    revision_number: Mapped[int] = mapped_column(primary_key=True)
    posting_date: Mapped[datetime.datetime | None]
    response_date: Mapped[datetime.datetime | None]
    archive_date: Mapped[datetime.datetime | None]
    unarchive_date: Mapped[datetime.datetime | None]
    syn_desc: Mapped[str | None]
    oth_cat_fa_desc: Mapped[str | None]
    agency_addr_desc: Mapped[str | None]
    cost_sharing: Mapped[str | None]
    number_of_awards: Mapped[str | None]
    est_funding: Mapped[str | None]
    award_ceiling: Mapped[str | None]
    award_floor: Mapped[str | None]
    fd_link_url: Mapped[str | None]
    fd_link_desc: Mapped[str | None]
    agency_contact_desc: Mapped[str | None]
    ac_email_addr: Mapped[str | None]
    ac_email_desc: Mapped[str | None]
    agency_name: Mapped[str | None]
    agency_phone: Mapped[str | None]
    a_sa_code: Mapped[str | None]
    ac_phone_number: Mapped[str | None]
    ac_name: Mapped[str | None]
    create_ts: Mapped[datetime.datetime]
    created_date: Mapped[datetime.datetime | None]
    last_upd_date: Mapped[datetime.datetime | None]
    creator_id: Mapped[str | None]
    last_upd_id: Mapped[str | None]
    sendmail: Mapped[str | None]
    response_date_desc: Mapped[str | None]
    applicant_elig_desc: Mapped[str | None]
    action_type: Mapped[str | None]
    action_date: Mapped[datetime.datetime | None]
    version_nbr: Mapped[int]
    modification_comments: Mapped[str | None]
    publisheruid: Mapped[str | None]
    publisher_profile_id: Mapped[int | None]

@declarative_mixin
class TapplicanttypesSynopsisMixin:

    at_syn_id: Mapped[int] = mapped_column(primary_key=True)
    at_id: Mapped[str] = mapped_column(primary_key=True)
    opportunity_id: Mapped[int] = mapped_column(primary_key=True)
    created_date: Mapped[datetime.datetime | None]
    last_upd_date: Mapped[datetime.datetime | None]
    creator_id: Mapped[str | None]
    last_upd_id: Mapped[str | None]

@declarative_mixin
class TapplicanttypesSynopsisHistMixin:

    at_syn_id: Mapped[int] = mapped_column(primary_key=True)
    at_id: Mapped[str] = mapped_column(primary_key=True)
    opportunity_id: Mapped[int] = mapped_column(primary_key=True)
    revision_number: Mapped[int] = mapped_column(primary_key=True)
    created_date: Mapped[datetime.datetime | None]
    last_upd_date: Mapped[datetime.datetime | None]
    creator_id: Mapped[str | None]
    last_upd_id: Mapped[str | None]

@declarative_mixin
class TfundactcatSynopsisMixin:

    fac_syn_id: Mapped[int] = mapped_column(primary_key=True)
    fac_id: Mapped[str] = mapped_column(primary_key=True)
    opportunity_id: Mapped[int] = mapped_column(primary_key=True)
    created_date: Mapped[datetime.datetime | None]
    last_upd_date: Mapped[datetime.datetime | None]
    creator_id: Mapped[str | None]
    last_upd_id: Mapped[str | None]

@declarative_mixin
class TfundactcatSynopsisHistMixin:

    fac_syn_id: Mapped[int] = mapped_column(primary_key=True)
    fac_id: Mapped[str] = mapped_column(primary_key=True)
    opportunity_id: Mapped[int] = mapped_column(primary_key=True)
    revision_number: Mapped[int] = mapped_column(primary_key=True)
    created_date: Mapped[datetime.datetime | None]
    last_upd_date: Mapped[datetime.datetime | None]
    creator_id: Mapped[str | None]
    last_upd_id: Mapped[str | None]

@declarative_mixin
class TfundinstrSynopsisMixin:

    fi_syn_id: Mapped[int] = mapped_column(primary_key=True)
    fi_id: Mapped[str] = mapped_column(primary_key=True)
    opportunity_id: Mapped[int] = mapped_column(primary_key=True)
    created_date: Mapped[datetime.datetime | None]
    last_upd_date: Mapped[datetime.datetime | None]
    creator_id: Mapped[str | None]
    last_upd_id: Mapped[str | None]

@declarative_mixin
class TfundinstrSynopsisHistMixin:

    fi_syn_id: Mapped[int] = mapped_column(primary_key=True)
    opportunity_id: Mapped[int] = mapped_column(primary_key=True)
    fi_id: Mapped[str] = mapped_column(primary_key=True)
    revision_number: Mapped[int] = mapped_column(primary_key=True)
    created_date: Mapped[datetime.datetime | None]
    last_upd_date: Mapped[datetime.datetime | None]
    creator_id: Mapped[str | None]
    last_upd_id: Mapped[str | None]