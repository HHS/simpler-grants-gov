import logging
import zipfile
from datetime import date

import pytest

from src.db.models.sam_extract_models import SamExtractFile
from src.db.models.user_models import LinkExternalUser
from src.task.sam_extracts.process_sam_extracts import ExtractIndex
from src.task.sam_extracts.setup_lower_env_sam_extracts import SetupLowerEnvSamExtractsTask
from src.util import file_util
from tests.conftest import BaseTestClass
from tests.lib.db_testing import cascade_delete_from_db_table
from tests.src.db.models.factories import (
    LinkExternalUserFactory,
    OrganizationUserFactory,
    SamExtractFileFactory,
    SamGovEntityFactory,
    UserFactory,
)


def verify_record_in_extract(
    extract_rows: list[str], user_email: str, expected_uei: str | None = None
) -> None:
    found_record = False
    for row in extract_rows:
        tokens = row.split("|")
        if tokens[ExtractIndex.EBIZ_POC_EMAIL - 1] == user_email:
            if expected_uei is not None:
                assert tokens[ExtractIndex.UEI - 1] == expected_uei
            found_record = True

            break

    assert found_record, f"Could not find expected record, user with email {user_email}"


class TestSetupLowerEnvSamExtractsTask(BaseTestClass):

    @pytest.fixture(autouse=True)
    def cleanup_data(self, db_session):
        cascade_delete_from_db_table(db_session, SamExtractFile)
        cascade_delete_from_db_table(db_session, LinkExternalUser)

    @pytest.fixture
    def setup_lower_env_sam_extracts_task(
        self, db_session, enable_factory_create, monkeypatch, mock_s3_bucket
    ):
        monkeypatch.setenv("DRAFT_FILES_BUCKET", "s3://" + mock_s3_bucket)
        return SetupLowerEnvSamExtractsTask(db_session, date(2025, 9, 1))

    def test_run_task(self, setup_lower_env_sam_extracts_task, mock_s3_bucket):
        # These users will need new orgs
        new_org_users = LinkExternalUserFactory.create_batch(size=3)

        # Existing org users
        existing_org_users = LinkExternalUserFactory.create_batch(size=4)
        for i, existing_org_user in enumerate(existing_org_users):
            sam_gov_entity = SamGovEntityFactory.create(
                uei=f"AUTO000000{i}", ebiz_poc_email=existing_org_user.email, has_organization=True
            )
            OrganizationUserFactory.create(
                organization=sam_gov_entity.organization, user=existing_org_user.user
            )

        # These users don't have a link external record, and will be skipped
        UserFactory.create_batch(size=2)

        setup_lower_env_sam_extracts_task.run()

        contents = ""
        with file_util.open_stream(
            f"s3://{mock_s3_bucket}/sam-extracts/fake-monthly/SAM_FOUO_FAKE_MONTHLY_V2_20250901.ZIP",
            "rb",
        ) as f:
            with zipfile.ZipFile(f) as extract_zip:
                with extract_zip.open("SAM_FOUO_V2_20250901.dat") as file_in_zip:
                    contents = file_in_zip.read().decode()

        all_lines = contents.split("\n")
        data_rows = all_lines[1:-1]

        for new_org_user in new_org_users:
            verify_record_in_extract(data_rows, new_org_user.email)

        for existing_org_user in existing_org_users:
            verify_record_in_extract(
                data_rows,
                existing_org_user.email,
                existing_org_user.user.organization_users[0].organization.sam_gov_entity.uei,
            )

        assert len(data_rows) == len(new_org_users) + len(existing_org_users)

        # Verify the header and footer
        assert all_lines[0] == "BOF FOUO V2 00000000 20250901 7 0000000"
        assert all_lines[-1] == "EOF FOUO V2 00000000 20250901 7 0000000"

    def test_run_task_already_processed_for_day(self, setup_lower_env_sam_extracts_task, caplog):
        caplog.set_level(logging.INFO)
        SamExtractFileFactory.create(extract_date=date(2025, 9, 1))

        setup_lower_env_sam_extracts_task.run()

        assert (
            setup_lower_env_sam_extracts_task.metrics[
                setup_lower_env_sam_extracts_task.Metrics.USER_COUNT
            ]
            == 0
        )

        assert "Already created an extract file for today" in caplog.text
