#
# SQLAlchemy models for foreign tables.
#
# The order of the columns must match the remote Oracle database. The names are not required to
# match by oracle_fdw, but we are matching them for maintainability.
#

import datetime

from sqlalchemy.orm import Mapped, declarative_mixin, mapped_column


@declarative_mixin
class TopportunityMixin:
    opportunity_id: Mapped[int] = mapped_column(primary_key=True)
    oppnumber: Mapped[str | None]
    revision_number: Mapped[int | None]
    opptitle: Mapped[str | None]
    owningagency: Mapped[str | None]
    publisheruid: Mapped[str | None]
    listed: Mapped[str | None]
    oppcategory: Mapped[str | None]
    initial_opportunity_id: Mapped[int | None]
    modified_comments: Mapped[str | None]
    created_date: Mapped[datetime.datetime | None]
    last_upd_date: Mapped[datetime.datetime | None]
    creator_id: Mapped[str | None]
    last_upd_id: Mapped[str | None]
    flag_2006: Mapped[str | None]
    category_explanation: Mapped[str | None]
    publisher_profile_id: Mapped[int | None]
    is_draft: Mapped[str | None]


@declarative_mixin
class TopportunityCfdaMixin:
    opp_cfda_id: Mapped[int] = mapped_column(primary_key=True)
    opportunity_id: Mapped[int]
    cfdanumber: Mapped[str | None]
    programtitle: Mapped[str | None]
    origtoppid: Mapped[int | None]
    oppidcfdanum: Mapped[str | None]
    origoppnum: Mapped[str | None]
    created_date: Mapped[datetime.datetime | None]
    last_upd_date: Mapped[datetime.datetime | None]
    creator_id: Mapped[str | None]
    last_upd_id: Mapped[str | None]


@declarative_mixin
class VOpportunitySummaryMixin:
    # NOTE: Only the following fields are used downstream with specific types:
    # - opportunity_id
    # - fo_last_upd_dt
    # - omb_review_status_date
    # - omb_review_status_display
    # All other fields must still be included here,
    # but they are not used downstream and can safely be typed as simple strings.
    opportunity_id: Mapped[int] = mapped_column(primary_key=True)
    owningagency: Mapped[str | None]
    oppnumber: Mapped[str | None]
    opptitle: Mapped[str | None]
    oppcategory: Mapped[str | None]
    oppcategory_desc: Mapped[str | None]
    category_explanation: Mapped[str | None]
    cfdanumbers: Mapped[str | None]
    synopsis_cnt: Mapped[str | None]
    forecast_cnt: Mapped[str | None]
    packages_cnt: Mapped[str | None]
    synopsis_post_date: Mapped[str | None]
    synopsis_archive_date: Mapped[str | None]
    synopsis_response_date: Mapped[str | None]
    synopsis_create_ts: Mapped[str | None]
    forecast_post_date: Mapped[str | None]
    forecast_archive_date: Mapped[str | None]
    forecast_create_ts: Mapped[str | None]
    active_packages_cnt: Mapped[str | None]
    inactive_form_pkg_cnt: Mapped[str | None]
    is_draft: Mapped[str]
    fo_last_upd_dt: Mapped[datetime.datetime | None]
    omb_review_status: Mapped[str | None]
    omb_review_status_user: Mapped[str | None]
    omb_review_status_date: Mapped[datetime.datetime | None]
    omb_review_status_userfullname: Mapped[str | None]
    revision_number: Mapped[str | None]
    publish_date: Mapped[str | None]
    omb_review_status_display: Mapped[str | None]
