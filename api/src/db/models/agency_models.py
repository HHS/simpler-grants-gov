from sqlalchemy import BigInteger, ForeignKey
from sqlalchemy.ext.associationproxy import AssociationProxy, association_proxy
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.adapters.db.type_decorators.postgres_type_decorators import LookupColumn
from src.constants.lookup_constants import (
    AgencyDownloadFileType,
    AgencySubmissionNotificationSetting,
)
from src.db.models.base import ApiSchemaTable, TimestampMixin
from src.db.models.lookup_models import (
    LkAgencyDownloadFileType,
    LkAgencySubmissionNotificationSetting,
)


class AgencyContactInfo(ApiSchemaTable, TimestampMixin):
    __tablename__ = "agency_contact_info"

    agency_contact_info_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)

    contact_name: Mapped[str]

    address_line_1: Mapped[str]
    address_line_2: Mapped[str | None]
    city: Mapped[str]

    # Note that while it would make sense to do an enum for state
    # it doesn't look to be limited to US states and includes some foreign states
    # as well as numbers(?) in the existing system
    state: Mapped[str]
    zip_code: Mapped[str]
    phone_number: Mapped[str]
    primary_email: Mapped[str]
    secondary_email: Mapped[str | None]


class Agency(ApiSchemaTable, TimestampMixin):
    __tablename__ = "agency"

    agency_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)

    agency_name: Mapped[str]

    agency_code: Mapped[str] = mapped_column(index=True, unique=True)
    sub_agency_code: Mapped[str | None]

    assistance_listing_number: Mapped[str]

    agency_submission_notification_setting: Mapped[
        AgencySubmissionNotificationSetting
    ] = mapped_column(
        "agency_submission_notification_setting_id",
        LookupColumn(LkAgencySubmissionNotificationSetting),
        ForeignKey(LkAgencySubmissionNotificationSetting.agency_submission_notification_setting_id),
    )

    agency_contact_info_id: Mapped[BigInteger | None] = mapped_column(
        BigInteger, ForeignKey(AgencyContactInfo.agency_contact_info_id)
    )
    agency_contact_info: Mapped[AgencyContactInfo | None] = relationship(AgencyContactInfo)

    # There are several agencies in the data we're ingesting that
    # are clearly meant for testing, I'm not certain we want to flag
    # them in this way, but adding it for now - can revisit later
    # From the legacy system configurations, this should be the following agencies
    # GDIT,IVV,IVPDF,0001,FGLT,NGMS,NGMS-Sub1,SECSCAN
    # including any subagencies
    is_test_agency: Mapped[bool]

    # These values come from the legacy system, but their exact usage isn't entirely
    # clear at this point in time.
    ldap_group: Mapped[str]
    description: Mapped[str]
    label: Mapped[str]

    is_multilevel_agency: Mapped[bool] = mapped_column(default=False)
    is_multiproject: Mapped[bool] = mapped_column(default=False)
    has_system_to_system_certificate: Mapped[bool] = mapped_column(default=False)
    can_view_packages_in_grace_period: Mapped[bool] = mapped_column(default=False)
    is_image_workspace_enabled: Mapped[bool] = mapped_column(default=False)
    is_validation_workspace_enabled: Mapped[bool] = mapped_column(default=False)

    link_agency_download_file_types: Mapped[list["LinkAgencyDownloadFileType"]] = relationship(
        back_populates="agency", uselist=True, cascade="all, delete-orphan"
    )

    agency_download_file_types: AssociationProxy[set[AgencyDownloadFileType]] = association_proxy(
        "link_agency_download_file_types",
        "agency_download_file_type",
        creator=lambda obj: LinkAgencyDownloadFileType(agency_download_file_type=obj),
    )


class LinkAgencyDownloadFileType(ApiSchemaTable, TimestampMixin):
    __tablename__ = "link_agency_download_file_type"

    agency_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(Agency.agency_id),
        primary_key=True,
    )
    agency: Mapped[Agency] = relationship(Agency)

    agency_download_file_type: Mapped[AgencyDownloadFileType] = mapped_column(
        "agency_download_file_type_id",
        LookupColumn(LkAgencyDownloadFileType),
        ForeignKey(LkAgencyDownloadFileType.agency_download_file_type_id),
        primary_key=True,
    )
