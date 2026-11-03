#
# SQLAlchemy models for foreign tables.
#
# The order of the columns must match the remote Oracle database. The names are not required to
# match by oracle_fdw, but we are matching them for maintainability.
#

from sqlalchemy.orm import Mapped, declarative_mixin, mapped_column


@declarative_mixin
class VAllApplicationsMixin:
    cfdanumber: Mapped[str | None]
    fundoppnumber: Mapped[str | None]
    competitionid: Mapped[str | None]
    opttitle: Mapped[str | None]
    processid: Mapped[str] = mapped_column(primary_key=True)
    datereceived: Mapped[str | None]
    status: Mapped[str | None]
    agencytrackingnumber: Mapped[str | None]
    agencyid: Mapped[str | None]
    owner: Mapped[str | None]
    org_duns: Mapped[str | None]
    submissionname: Mapped[str | None]
    ismulti: Mapped[str | None]
    requestedamount: Mapped[str | None]
    name: Mapped[str | None]
    update_time: Mapped[str | None]
    agencynotes: Mapped[str | None]
    legal_business_name: Mapped[str | None]
    legal_name: Mapped[str | None]
    aor_name: Mapped[str | None]
    third_party_submitter_id: Mapped[str | None]
    agencyname: Mapped[str | None]
    workspace_id: Mapped[str | None]
    submission_method: Mapped[str | None]
    submission_name: Mapped[str | None]
    oractle_null: Mapped[str | None]
    state: Mapped[str | None]
    package_id: Mapped[str | None]
    topportunity_id: Mapped[str | None]
    org_exclusion_flag: Mapped[str | None]
    org_delinq_flag: Mapped[str | None]
    owner_profile_id: Mapped[str | None]
    competitiontitle: Mapped[str | None]
    package_id_alt: Mapped[str | None]
    prev_processid: Mapped[str | None]
    applicantname: Mapped[str | None]
    applicanttype: Mapped[str | None]
    agencyrcvddate: Mapped[str | None]
    programtitle: Mapped[str | None]
    sam_uei: Mapped[str | None]
    sam_duns: Mapped[str | None]
