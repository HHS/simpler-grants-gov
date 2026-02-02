import pytest

from src.adapters.aws import S3Config
from src.services.opportunity_attachments import attachment_util
from tests.src.db.models.factories import OpportunityFactory


@pytest.mark.parametrize(
    "is_draft,opportunity_id,attachment_id,file_name,expected_path",
    [
        (
            False,
            "955058ea-e95a-40df-b881-26e3b98699be",
            "3fda3bca-7091-40df-8550-021ddc8bf9e6",
            "my_file.txt",
            "s3://test-public-bucket/opportunities/955058ea-e95a-40df-b881-26e3b98699be/attachments/3fda3bca-7091-40df-8550-021ddc8bf9e6/my_file.txt",
        ),
        (
            True,
            "f64657c8-df6e-426d-9788-d4b50c2aee8f",
            "00488774-8c56-47f9-b8ad-5476d310cb54",
            "example.pdf",
            "s3://test-draft-bucket/opportunities/f64657c8-df6e-426d-9788-d4b50c2aee8f/attachments/00488774-8c56-47f9-b8ad-5476d310cb54/example.pdf",
        ),
        (
            False,
            "7c709b9a-93ab-4857-b8e7-113b1d02572f",
            "06118982-b328-4d5b-8d77-babd60dcc36a",
            "example.docx",
            "s3://test-public-bucket/opportunities/7c709b9a-93ab-4857-b8e7-113b1d02572f/attachments/06118982-b328-4d5b-8d77-babd60dcc36a/example.docx",
        ),
    ],
)
def test_get_s3_attachment_path(is_draft, opportunity_id, attachment_id, file_name, expected_path):
    config = S3Config(
        PUBLIC_FILES_BUCKET="s3://test-public-bucket", DRAFT_FILES_BUCKET="s3://test-draft-bucket"
    )

    opp = OpportunityFactory.build(opportunity_id=opportunity_id, is_draft=is_draft)

    assert (
        attachment_util.get_s3_attachment_path(file_name, attachment_id, opp, config)
        == expected_path
    )


@pytest.mark.parametrize(
    "existing_file_name,expected_file_name",
    [
        ("abc.txt", "abc.txt"),
        ("my file.pdf", "my_file.pdf"),
        ("a.b.c.wav", "a.b.c.wav"),
        ("my-valid~file_is.good.txt", "my-valid~file_is.good.txt"),
        ("!@#$%^&*()'\",/;'myfile.txt", "myfile.txt"),
        ("0123456789 |[]", "0123456789_"),
        ("many       spaces.txt", "many_spaces.txt"),
        ("other\t\twhitespace\n\nremoved.txt", "other_whitespace_removed.txt"),
    ],
)
def test_adjust_legacy_file_name(existing_file_name, expected_file_name):
    assert attachment_util.adjust_legacy_file_name(existing_file_name) == expected_file_name
