from datetime import datetime

from sqlalchemy.orm import Mapped, declarative_mixin, mapped_column


@declarative_mixin
class TcompetitionMixin:
    comp_id: Mapped[int | None] = mapped_column(primary_key=True)
    opp_cfda_id: Mapped[int | None]
    competitionid: Mapped[str | None]
    familyid: Mapped[int | None]
    competitiontitle: Mapped[str | None]
    openingdate: Mapped[datetime | None]
    closingdate: Mapped[datetime | None]
    contactinfo: Mapped[str | None]
    graceperiod: Mapped[int | None]
    opentoapplicanttype: Mapped[int | None]
    dialect: Mapped[str]
    last_update: Mapped[datetime | None]
    electronic_required: Mapped[str | None]
    expected_appl_num: Mapped[int | None]
    expected_appl_size: Mapped[int | None]
    origcfdanum: Mapped[str | None]
    origoppnumber: Mapped[str | None]
    created_date: Mapped[datetime | None]
    last_upd_date: Mapped[datetime | None]
    creator_id: Mapped[str | None]
    last_upd_id: Mapped[str | None]
    ismulti: Mapped[str | None]
    agency_dwnld_url: Mapped[str | None]
    package_id: Mapped[str | None]
    is_wrkspc_compatible: Mapped[str]
    sendmail: Mapped[str | None]
    modification_comments: Mapped[str | None]
