import logging
import os
import secrets
import string
import uuid
import zipfile
from datetime import date
from enum import StrEnum
from typing import Sequence

from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.adapters.aws import S3Config
from src.constants.lookup_constants import SamGovExtractType, SamGovProcessingStatus
from src.db.models.entity_models import Organization, SamGovEntity
from src.db.models.sam_extract_models import SamExtractFile
from src.db.models.user_models import LinkExternalUser, OrganizationUser, User
from src.task.sam_extracts.process_sam_extracts import ExtractIndex
from src.task.task import Task
from src.util import datetime_util, file_util

logger = logging.getLogger(__name__)


class SetupLowerEnvSamExtractsTask(Task):
    """Task that creates a fake sam.gov extract
    file that automatically sets up each user
    in their own organization in our lower environment.
    """

    class Metrics(StrEnum):
        USER_COUNT = "user_count"
        HAS_EXISTING_ORG_COUNT = "has_existing_org_count"
        NEW_ORG_COUNT = "new_org_count"

    def __init__(self, db_session: db.Session, current_date: date | None = None) -> None:
        super().__init__(db_session)

        if current_date is None:
            current_date = datetime_util.get_now_us_eastern_date()

        self.current_date = current_date

        self.s3_config = S3Config()

        self.environment: str | None = os.getenv("ENVIRONMENT", None)

    def run_task(self) -> None:
        # We do not want to let this task run outside of our development
        # environments. While it shouldn't be configured to do so, this
        # is making extra certain that that is the case.
        if self.environment not in ("local", "dev", "staging"):
            raise Exception("ENVIRONMENT must be local, dev or staging")

        with self.db_session.begin():
            # Multiple extract files in one day runs into logic issues with
            # processing them out-of-order as well as needing to change file names.
            existing_extract_file = self.db_session.execute(
                select(SamExtractFile).where(SamExtractFile.extract_date == self.current_date)
            ).scalar_one_or_none()
            if existing_extract_file is not None:
                logger.info("Already created an extract file for today, not creating another one.")
                return

            users = self.get_users()

            # For each user, create a row in the fake sam extract
            # file for them so they'll all get an organization
            # If a user already has one of these organizations, it
            # should be reused.
            rows = []
            for user in users:
                self.increment(self.Metrics.USER_COUNT)
                uei = self.determine_uei(user)
                rows.append(self.build_sam_extract_row(user, uei))

            self.create_extract_file(rows)

    def get_users(self) -> Sequence[User]:
        """Get all users"""
        users = (
            self.db_session.execute(
                select(User)
                .join(LinkExternalUser)
                .options(
                    selectinload(User.organization_users)
                    .selectinload(OrganizationUser.organization)
                    .selectinload(Organization.sam_gov_entity)
                )
            )
            .scalars()
            .all()
        )

        return users

    def determine_uei(self, user: User) -> str:
        """Determine the UEI for a user

        All UEIs we generate are formatted as "AUTO________"

        If a user has previously had an automatically added
        sam.gov entity record, find it. We'll assume that
        a user only has one organization where their email
        is the EBIZ POC + the UEI is of the AUTO format.
        Even if this ends up wrong, the purpose of this logic is
        to give each user an org, this type of user would already have
        multiple orgs so it wouldn't matter much
        """

        for org_user in user.organization_users:
            entity = org_user.organization.sam_gov_entity
            if (
                entity is not None
                and entity.uei.startswith("AUTO")
                and entity.ebiz_poc_email == user.email
            ):
                self.increment(self.Metrics.HAS_EXISTING_ORG_COUNT)
                logger.info(
                    "User has an existing organization",
                    extra={"uei": entity.uei, "user_id": user.user_id},
                )
                return entity.uei

        # Assume this is a new user, generate a new UEI for them

        for _ in range(5):
            uei = generate_uei()

            existing_record = self.db_session.execute(
                select(SamGovEntity).where(SamGovEntity.uei == uei)
            ).scalar_one_or_none()
            if existing_record is None:
                self.increment(self.Metrics.NEW_ORG_COUNT)
                logger.info(
                    "User has no existing organization", extra={"uei": uei, "user_id": user.user_id}
                )
                return uei

        raise Exception("Could not generate a unique UEI after 5 attempts")

    def create_extract_file(self, rows: list[str]) -> None:
        # The header and footer are formatted as
        # BOF/EOF FOUO V2 STARTDATE ENDDATE RECORD_COUNT SEQUENCE_NUMBER
        # In the monthly extract we're pretending to be, start date is all 0s
        # We don't look at the sequence, so just make it static
        date_str = self.current_date.strftime("%Y%m%d")
        row_count = len(rows)
        header = f"BOF FOUO V2 00000000 {date_str} {row_count} 0000000"
        footer = f"EOF FOUO V2 00000000 {date_str} {row_count} 0000000"

        file_contents = [header] + rows + [footer]
        file_text = "\n".join(file_contents)

        filename = f"SAM_FOUO_FAKE_MONTHLY_V2_{date_str}.ZIP"
        s3_path = f"{self.s3_config.draft_files_bucket_path}/sam-extracts/fake-monthly/{filename}"
        with file_util.open_stream(s3_path, "wb") as outfile:
            with zipfile.ZipFile(outfile, "w") as extract_zip:
                extract_zip.writestr(f"SAM_FOUO_V2_{date_str}.dat", file_text)

        # Create an extract record, we mark these
        # as monthly because it's always a full extract
        extract = SamExtractFile(
            extract_type=SamGovExtractType.MONTHLY,
            extract_date=self.current_date,
            filename=filename,
            s3_path=s3_path,
            processing_status=SamGovProcessingStatus.PENDING,
            sam_extract_file_id=uuid.uuid4(),
        )
        self.db_session.add(extract)
        logger.info(
            "Created a fake monthly extract file",
            extra={"extract_date": self.current_date, "s3_path": s3_path},
        )

    def build_sam_extract_row(self, user: User, uei: str) -> str:
        """For each user, create a record in the extract"""
        # This shouldn't happen if we fetched the data right
        # but just as a safety net
        if user.email is None:
            raise Exception("User has no email, can't make an org")

        # Initialize an array with 300 empty strings
        # we'll populate just the values we care about
        data = [""] * 300

        # The configuration we have sets the numbers to match what
        # the documentation says which starts counting at 1, so subtract
        # to setup the indexes properly.
        data[ExtractIndex.UEI - 1] = uei
        data[ExtractIndex.SAM_EXTRACT_CODE - 1] = "A"
        data[ExtractIndex.LEGAL_BUSINESS_NAME - 1] = (
            f"Automatic {self.environment} Organization for UEI {uei}"
        )
        data[ExtractIndex.REGISTRATION_EXPIRATION_DATE - 1] = "20600101"
        data[ExtractIndex.EBIZ_POC_EMAIL - 1] = user.email
        data[ExtractIndex.EBIZ_POC_FIRST_NAME - 1] = (
            user.profile.first_name if user.profile else "Unknown"
        )
        data[ExtractIndex.EBIZ_POC_LAST_NAME - 1] = (
            user.profile.first_name if user.profile else "Person"
        )
        data[ExtractIndex.DEBT_SUBJECT_TO_OFFSET - 1] = ""
        data[ExtractIndex.EXCLUSION_STATUS_FLAG - 1] = "N"
        data[ExtractIndex.ENTITY_EFT_INDICATOR - 1] = ""
        data[ExtractIndex.INITIAL_REGISTRATION_DATE - 1] = "20250101"
        data[ExtractIndex.LAST_UPDATE_DATE - 1] = self.current_date.strftime("%Y%m%d")

        return "|".join(data) + "!end"


def generate_uei() -> str:
    """Generate an UEI for each user"""
    # Note that UEI MUST be 12-characters long.
    return "AUTO" + "".join(secrets.choice(string.ascii_uppercase) for _ in range(8))
