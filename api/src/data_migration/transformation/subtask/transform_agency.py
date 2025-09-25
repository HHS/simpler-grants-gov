import logging
import typing
from dataclasses import dataclass, field
from datetime import datetime
from enum import StrEnum
from typing import Any

from pydantic import Field
from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.data_migration.transformation.transform_constants as transform_constants
import src.data_migration.transformation.transform_util as transform_util
from src.constants.lookup_constants import (
    AgencyDownloadFileType,
    AgencySubmissionNotificationSetting,
)
from src.data_migration.transformation.subtask.abstract_transform_subtask import (
    AbstractTransformSubTask,
)
from src.db.models.agency_models import Agency, AgencyContactInfo, LinkAgencyDownloadFileType
from src.db.models.staging.tgroups import Tgroups
from src.task.task import Task
from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)

NULLABLE_FIELDS = {
    "AgencyCode",  # Note this is the sub_agency_code in our system
    "AgencyContactEMail2",
    "ldapGp",
    "description",
    "label",
}

AGENCY_FIELD_MAP = {
    "AgencyName": "agency_name",
    "AgencyCode": "sub_agency_code",
    "AgencyCFDA": "assistance_listing_number",
    "AgencyDownload": "agency_download_file_types",
    "AgencyNotify": "agency_submission_notification_setting",
    "ldapGp": "ldap_group",
    "description": "description",
    "label": "label",
    "multilevel": "is_multilevel_agency",
    "HasS2SCert": "has_system_to_system_certificate",
    "ViewPkgsInGracePeriod": "can_view_packages_in_grace_period",
    "multiproject": "is_multiproject",
    "ImageWS": "is_image_workspace_enabled",
    "ValidationWS": "is_validation_workspace_enabled",
}

AGENCY_CONTACT_INFO_FIELD_MAP = {
    "AgencyContactName": "contact_name",
    "AgencyContactAddress1": "address_line_1",
    "AgencyContactAddress2": "address_line_2",
    "AgencyContactCity": "city",
    "AgencyContactState": "state",
    "AgencyContactZipCode": "zip_code",
    "AgencyContactTelephone": "phone_number",
    "AgencyContactEMail": "primary_email",
    "AgencyContactEMail2": "secondary_email",
}

NOT_MAPPED_FIELDS = {
    "AgencyEnroll",
    "ForecastPOC",
    "ForecastPOCEmail",
    "ForecastPOCEmailDesc",
    "ForecastPOCPhone",
    "SynopsisPOC",
    "SynopsisPOCEmail",
    "SynopsisPOCEmailDesc",
    "PackagePOC",
    # These fields were only found in the test environment
    "ASSISTCompatible",
    "SAMValidation",
    # This was added in Jan 2025 in Grants.gov, we aren't using it yet
    "AllowSubmitWithExpSAM",
    # Review process flags added in prod to test agencies
    "ReviewProcessEnable",
    "ReviewProcessGoLive",
    "EnableReviewProcess",
    "ReviewProcessPeriod",
}

REQUIRED_FIELDS = {
    "AgencyName",
    "AgencyCFDA",
    "AgencyDownload",
    "AgencyNotify",
    "AgencyContactName",
    "AgencyContactAddress1",
    "AgencyContactCity",
    "AgencyContactState",
    "AgencyContactZipCode",
    "AgencyContactTelephone",
    "AgencyContactEMail",
}


class AgencyConfig(PydanticBaseEnvConfig):
    # TODO - we might want to put this somewhere more central
    #        as we might want to filter these out in other places
    prefix_env: str = Field(
        default="GDIT,IVV,IVPDF,0001,FGLT,NGMS,SECSCAN", alias="TEST_AGENCY_PREFIXES"
    )
    test_agency_config: set[str] = Field(default=set())

    def model_post_init(self, _context: typing.Any) -> None:
        """Run after __init__ sets above values from env vars"""

        self.test_agency_config = set(self.prefix_env.split(","))


@dataclass
class TgroupAgency:
    """
    Container class for holding all tgroup records for
    a given agency.
    """

    agency_code: str
    tgroups: list[Tgroups] = field(default_factory=list)

    has_update: bool = False

    def add_tgroup(self, tgroup: Tgroups) -> None:
        if tgroup.transformed_at is None:
            self.has_update = True

        self.tgroups.append(tgroup)

    def get_updated_field_names(self) -> set[str]:
        return {tgroup.get_field_name() for tgroup in self.tgroups if tgroup.transformed_at is None}


@dataclass
class AgencyUpdates:
    """
    Container class for holding all of the necessary updates
    for an agency
    """

    agency_updates: dict[str, Any] = field(default_factory=dict)
    agency_contact_info_updates: dict[str, Any] = field(default_factory=dict)
    agency_download_file_types: set[AgencyDownloadFileType] = field(default_factory=set)

    agency_created_at: datetime | None = None
    agency_updated_at: datetime | None = None


class TransformAgency(AbstractTransformSubTask):
    def __init__(self, task: Task, agency_config: AgencyConfig | None = None) -> None:
        super().__init__(task)

        if agency_config is None:
            agency_config = AgencyConfig()

        self.agency_config = agency_config

    def transform_records(self) -> None:
        # fetch tgroup records
        tgroup_map = self.fetch_tgroup_mapping()

        # Fetch all existing agencies
        agency_map = self.fetch_agency_mapping()

        for agency_code, tgroup_agency in tgroup_map.items():
            agency = agency_map.get(agency_code)

            try:
                self.process_tgroups(tgroup_agency, agency)
            except ValueError:
                self.increment(
                    transform_constants.Metrics.TOTAL_ERROR_COUNT,
                    prefix=transform_constants.AGENCY,
                )
                logger.exception("Failed to process agency", extra={"agency_code": agency_code})

    def fetch_tgroup_mapping(self) -> dict[str, TgroupAgency]:
        tgroups = self.db_session.scalars(select(Tgroups))

        tgroup_mapping: dict[str, TgroupAgency] = {}

        for tgroup in tgroups:
            agency_code = tgroup.get_agency_code()

            if agency_code not in tgroup_mapping:
                tgroup_mapping[agency_code] = TgroupAgency(agency_code)

            tgroup_mapping[agency_code].add_tgroup(tgroup)

        return tgroup_mapping

    def fetch_agency_mapping(self) -> dict[str, Agency]:
        agencies = self.db_session.scalars(
            select(Agency).options(selectinload(Agency.agency_contact_info))
        )

        return {agency.agency_code: agency for agency in agencies}

    def process_tgroups(self, tgroup_agency: TgroupAgency, agency: Agency | None) -> None:
        log_extra = {"agency_code": tgroup_agency.agency_code}
        logger.info("Processing agency", extra=log_extra)
        if not tgroup_agency.has_update:
            logger.info("No updates for agency", extra=log_extra)
            return

        # Only increment counter for agencies with something to update
        self.increment(
            transform_constants.Metrics.TOTAL_RECORDS_PROCESSED, prefix=transform_constants.AGENCY
        )

        # New agency insert case
        is_insert = False
        if agency is None:
            is_insert = True
            # If any field that is required for creating an agency is missing, we want to error
            missing_required_fields = REQUIRED_FIELDS - tgroup_agency.get_updated_field_names()
            if missing_required_fields:
                raise ValueError(
                    "Cannot create agency %s as required fields are missing: %s"
                    % (tgroup_agency.agency_code, ",".join(missing_required_fields))
                )

            logger.info("Creating new agency", extra=log_extra)
            agency = Agency(agency_code=tgroup_agency.agency_code)
            agency.agency_contact_info = AgencyContactInfo()
        else:
            logger.info("Updating agency", extra=log_extra)

        updates = get_agency_updates(tgroup_agency)
        apply_updates(
            agency, updates.agency_updates, updates.agency_created_at, updates.agency_updated_at
        )
        apply_updates(
            agency.agency_contact_info,
            updates.agency_contact_info_updates,
            updates.agency_created_at,
            updates.agency_updated_at,
        )
        self.update_agency_download_file_types(agency, updates.agency_download_file_types)

        # Set whether the agency is a test agency based on the config
        # Note that we also recalculate this in the TransformAgencyHierarchy task that runs after this
        agency.is_test_agency = is_test_agency_code(tgroup_agency.agency_code, self.agency_config)

        # After we have fully updated the agency, set the transformed_at timestamp
        # for all tgroup records that weren't already set.
        for tgroup in tgroup_agency.tgroups:
            if tgroup.transformed_at is None:
                tgroup.transformed_at = self.transform_time

        if is_insert:
            self.increment(
                transform_constants.Metrics.TOTAL_RECORDS_INSERTED,
                prefix=transform_constants.AGENCY,
            )
        else:
            self.increment(
                transform_constants.Metrics.TOTAL_RECORDS_UPDATED, prefix=transform_constants.AGENCY
            )

        self.db_session.add(agency)
        logger.info("Processed agency", extra=log_extra)

    def update_agency_download_file_types(
        self, agency: Agency, agency_download_file_types: set[AgencyDownloadFileType]
    ) -> None:
        # If the download file types we have set is already the same, just return
        if agency.agency_download_file_types == agency_download_file_types:
            return

        file_types_to_delete = set(agency.agency_download_file_types) - agency_download_file_types
        file_types_to_add = agency_download_file_types - set(agency.agency_download_file_types)

        for link_agency_download_file_type in agency.link_agency_download_file_types:
            if link_agency_download_file_type.agency_download_file_type in file_types_to_delete:
                self.db_session.delete(link_agency_download_file_type)

        for file_type_to_add in file_types_to_add:
            self.db_session.add(
                LinkAgencyDownloadFileType(
                    agency=agency, agency_download_file_type=file_type_to_add
                )
            )


class TransformAgencyHierarchy(AbstractTransformSubTask):
    def __init__(self, task: Task, agency_config: AgencyConfig | None = None) -> None:
        super().__init__(task)

        if agency_config is None:
            agency_config = AgencyConfig()

        self.agency_config = agency_config

    def transform_records(self) -> None:
        agencies = self.db_session.scalars(select(Agency)).all()
        agency_map = {agency.agency_code: agency for agency in agencies}

        for agency in agencies:
            log_extra = {"agency_code": agency.agency_code}
            logger.info("Processing agency hierarchy", extra=log_extra)

            top_level_agency_code = self.get_top_level_agency_code(agency.agency_code)
            logger.info(
                "Determined top level agency code for agency",
                extra=log_extra | {"top_level_agency_code": top_level_agency_code},
            )
            if top_level_agency_code and top_level_agency_code in agency_map:
                agency.top_level_agency = agency_map[top_level_agency_code]
            else:
                # We want to unset the top level agency if something is incorrectly
                # pointed to (just as a safeguard)
                agency.top_level_agency = None

            # Recalculate whether an agency is a test agency on each run
            # in case we update the config values
            # This same function is called whenever we create/update an agency that has other updates
            is_test_agency = is_test_agency_code(
                (agency.top_level_agency or agency).agency_code, self.agency_config
            )
            logger.info(
                "Determined whether agency is a test agency",
                extra=log_extra | {"is_test_agency": is_test_agency},
            )

            agency.is_test_agency = is_test_agency

    def get_top_level_agency_code(self, agency_code: str) -> str | None:
        if "-" not in agency_code:
            return None
        return agency_code.split("-")[0]


class ValidateAgencyData(AbstractTransformSubTask):
    """Validate (but do not modify) agency data

    We simply want to detect if anything with the data seems
    incorrect as we've noticed some oddities with the agency data.
    """

    class Metrics(StrEnum):
        AGENCY_VALIDATED_COUNT = "agency_validated_count"
        TEST_AGENCY_COUNT = "test_agency_count"
        ORPHANED_CHILD_AGENCY_COUNT = "orphaned_child_agency_count"
        UNEXPECTED_TOP_LEVEL_AGENCY_COUNT = "unexpected_top_level_agency_count"
        PARENT_WITH_PARENT_AGENCY_COUNT = "parent_with_parent_agency_count"

    def transform_records(self) -> None:
        agencies = self.db_session.scalars(
            select(Agency).options(selectinload(Agency.top_level_agency))
        ).all()

        for agency in agencies:
            self.validate_agency(agency)
            self.increment(self.Metrics.AGENCY_VALIDATED_COUNT)

    def validate_agency(self, agency: Agency) -> None:
        top_level_agency: Agency | None = agency.top_level_agency

        log_extra = {
            "agency_code": agency.agency_code,
            "is_test_agency": agency.is_test_agency,
            "top_level_agency_code": top_level_agency.agency_code if top_level_agency else None,
            "is_parent_test_agency": top_level_agency.is_test_agency if top_level_agency else None,
        }
        logger.info("Validating agency", extra=log_extra)

        if agency.is_test_agency:
            self.increment(self.Metrics.TEST_AGENCY_COUNT)

        # If an agency has a dash in it, we would expect it to have a parent agency
        if top_level_agency is None and is_child_agency(agency):
            logger.warning("Likely child agency is orphaned and has no parent", extra=log_extra)
            self.increment(self.Metrics.ORPHANED_CHILD_AGENCY_COUNT)

        if top_level_agency is not None:
            # We expect our process that connects child agencies to top level agencies to function
            # correctly, but have seen very weird cases where the codes didn't match
            expected_parent_agency_code = agency.agency_code.split("-")[0]
            if expected_parent_agency_code != top_level_agency.agency_code:
                logger.warning("Agency has unexpected top level agency", extra=log_extra)
                self.increment(self.Metrics.UNEXPECTED_TOP_LEVEL_AGENCY_COUNT)

            # Only a child agency should have a top-level parent agency
            if not is_child_agency(agency):
                logger.warning("Agency has a parent, but is not a child agency", extra=log_extra)
                self.increment(self.Metrics.PARENT_WITH_PARENT_AGENCY_COUNT)


############################
# Transformation / utility functions
############################

AGENCY_DOWNLOAD_FILE_TYPE_MAP = {
    "0": set(),
    "1": {AgencyDownloadFileType.XML},
    "2": {AgencyDownloadFileType.XML, AgencyDownloadFileType.PDF},
    "3": {AgencyDownloadFileType.PDF},
}

AGENCY_SUBMISSION_NOTIFICATION_SETTING_MAP = {
    "1": AgencySubmissionNotificationSetting.NEVER,
    "2": AgencySubmissionNotificationSetting.FIRST_APPLICATION_ONLY,
    "3": AgencySubmissionNotificationSetting.ALWAYS,
}


def get_agency_updates(tgroup_agency: TgroupAgency) -> AgencyUpdates:
    updates = AgencyUpdates()

    for tgroup in tgroup_agency.tgroups:
        if not tgroup.is_modified:
            continue

        tgroup_field_name = tgroup.get_field_name()

        # First check if this is a known unmapped field
        if tgroup_field_name in NOT_MAPPED_FIELDS:
            logger.info(
                "Skipping processing of field %s for %s",
                tgroup_field_name,
                tgroup_agency.agency_code,
            )
            continue

        # Check if the field has a mapping
        has_mapping = (
            tgroup_field_name == "AgencyDownload"
            or tgroup_field_name in AGENCY_FIELD_MAP
            or tgroup_field_name in AGENCY_CONTACT_INFO_FIELD_MAP
        )

        if not has_mapping:
            logger.warning(
                "Skipping unmapped field %s for %s - consider adding to NOT_MAPPED_FIELDS if intentional",
                tgroup_field_name,
                tgroup_agency.agency_code,
            )
            continue

        # TODO - how we want to actually handle deleted rows likely needs more investigation
        #        and discussion - do we assume that if certain fields are deleted that the
        #        entire agency should be deleted? Can they even be deleted once an opportunity refers to them?
        #        Rather than focus too much on that detail right now, I'm deferring
        #        a more thorough investigation to later
        # For now - we'll error any agency that has deleted rows except for a few
        # specific fields we know are safe to delete.
        if tgroup.is_deleted:
            if tgroup_field_name not in NULLABLE_FIELDS:
                raise ValueError(
                    "Field %s in tgroups cannot be deleted as it is not nullable"
                    % tgroup_field_name
                )
            value = None
        else:
            value = convert_field_values(tgroup_field_name, tgroup.value)

        if tgroup_field_name == "AgencyDownload":
            updates.agency_download_file_types = value  # type: ignore[assignment]

        elif tgroup_field_name in AGENCY_FIELD_MAP:
            field_name = AGENCY_FIELD_MAP[tgroup_field_name]
            updates.agency_updates[field_name] = value

        elif tgroup_field_name in AGENCY_CONTACT_INFO_FIELD_MAP:
            field_name = AGENCY_CONTACT_INFO_FIELD_MAP[tgroup_field_name]
            updates.agency_contact_info_updates[field_name] = value

        # We effectively need to merge the created_at/updated_at timestamps to the earliest/latest respectively
        created_at, updated_at = transform_util.get_create_update_timestamps(
            tgroup.created_date, tgroup.last_upd_date
        )

        if updates.agency_created_at is None or created_at < updates.agency_created_at:
            updates.agency_created_at = created_at

        if updates.agency_updated_at is None or updated_at > updates.agency_updated_at:
            updates.agency_updated_at = updated_at

    return updates


def convert_field_values(field_name: str, value: str | None) -> Any:
    if field_name == "AgencyDownload":
        return transform_agency_download_file_types(value)
    elif field_name == "AgencyNotify":
        return transform_agency_notify(value)
    elif field_name == "multilevel":
        return transform_util.convert_true_false_bool(value)
    elif field_name == "HasS2SCert":
        return transform_util.convert_yn_bool(value)
    elif field_name == "multiproject":
        return transform_util.convert_yn_bool(value)
    elif field_name == "ViewPkgsInGracePeriod":
        return transform_util.convert_yn_bool(value)
    elif field_name == "ImageWS":
        return transform_util.convert_yn_bool(value)
    elif field_name == "ValidationWS":
        return transform_util.convert_yn_bool(value)
    elif field_name == "AgencyContactAddress2":
        return transform_util.convert_null_like_to_none(value)

    return value


def transform_agency_download_file_types(value: str | None) -> set[AgencyDownloadFileType]:
    if value not in AGENCY_DOWNLOAD_FILE_TYPE_MAP:
        raise ValueError("Unrecognized agency download file type value %s" % value)

    return AGENCY_DOWNLOAD_FILE_TYPE_MAP[value]


def transform_agency_notify(value: str | None) -> AgencySubmissionNotificationSetting:
    if value not in AGENCY_SUBMISSION_NOTIFICATION_SETTING_MAP:
        raise ValueError("Unrecognized agency notify setting value: %s" % value)

    return AGENCY_SUBMISSION_NOTIFICATION_SETTING_MAP[value]


def apply_updates(
    record: Agency | AgencyContactInfo | None,
    updates: dict[str, Any],
    created_at: datetime | None,
    updated_at: datetime | None,
) -> None:
    # Note MyPy doesn't quite follow the typing in this function because it thinks
    # created_at/updated_at aren't ever None. While they aren't ever null in the DB,
    # before we insert a record they may not be set. Hence the type:ignores here

    if record is None:
        # This shouldn't happen but need to make mypy happy because agency contact info
        # can technically be null
        raise ValueError("Cannot pass none value into apply_updates")

    for field_name, value in updates.items():
        setattr(record, field_name, value)

    # We will only set created_at if the value doesn't already exist on the record
    # It would be confusing to change the created_at timestamp after the initial insert
    if record.created_at is None and created_at is not None:  # type: ignore[unreachable]
        record.created_at = created_at  # type: ignore[unreachable]

    # Updated at we'll either set if the value currently is null (ie. we're doing an insert)
    # or if it is greater than whatever already exists.
    if record.updated_at is None and updated_at is not None:  # type: ignore[unreachable]
        record.updated_at = updated_at  # type: ignore[unreachable]
    elif (
        record.updated_at is not None and updated_at is not None and record.updated_at < updated_at
    ):
        record.updated_at = updated_at


def is_test_agency_code(top_level_agency_code: str, agency_config: AgencyConfig) -> bool:
    """Determine whether an agency is a test agency

    If the top_level_agency_code matches one of the configured values, it is a test agency
    """
    return top_level_agency_code in agency_config.test_agency_config


def is_child_agency(agency: Agency) -> bool:
    """Determine whether an agency looks like a child agency, that is, it has ANY dash ('-') in it"""
    return "-" in agency.agency_code
