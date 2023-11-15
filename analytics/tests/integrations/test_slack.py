"""Test the code in analytics.etl.slack."""
from slack_sdk import WebClient  # noqa: I001

from analytics.etl.slack import (
    FileMapping,
    fetch_slack_channel_info,
    upload_file_to_slack_channel,
)
from config import settings

client = WebClient(token=settings.slack_bot_token)


def test_fetch_slack_channels():
    """The fetch_slack_channels() function should execute correctly."""
    result = fetch_slack_channel_info(
        client=client,
        channel_id=settings.reporting_channel_id,
    )
    assert result["ok"] is True
    assert result["channel"]["name"] == "z_bot-sprint-reporting"


def test_upload_files_to_slack_channel():
    """The upload_files_to_slack_channel() function should execute correctly."""
    # setup - create test files to upload
    files = [
        FileMapping(file_path="data/test1.txt", file_name="test1.txt"),
        FileMapping(file_path="data/test2.txt", file_name="test2.txt"),
    ]
    for _file in files:
        with open(_file.file_path, "w", encoding="utf-8") as f:
            f.write(_file.file_name)
    # execution - run the upload
    result = upload_file_to_slack_channel(
        client=client,
        files=files,
        channel_id=settings.reporting_channel_id,
        message="This is a test upload",
    )
    print(result["files"])
    assert result["ok"] is True
    assert result["files"] is not None
