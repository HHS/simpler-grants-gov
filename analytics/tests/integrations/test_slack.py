import pytest
from slack_sdk import WebClient

from analytics.etl.slack import (
    fetch_slack_channel_info,
    upload_file_to_slack_channel,
    FileMapping,
)
from config import settings

client = WebClient(token=settings.slack_bot_token)


def test_fetch_slack_channels():
    result = fetch_slack_channel_info(
        client=client,
        channel_id=settings.reporting_channel_id,
    )
    assert result["ok"] == True
    assert result["channel"]["name"] == "z_bot-sprint-reporting"


def test_upload_files_to_slack_channels():
    # setup - create test files to upload
    files = [
        FileMapping(file_path="data/test1.txt", file_name="test1.txt"),
        FileMapping(file_path="data/test2.txt", file_name="test2.txt"),
    ]
    for _file in files:
        with open(_file.file_path, "w") as f:
            f.write(_file.file_name)
    # execution - run the upload
    result = upload_file_to_slack_channel(
        client=client,
        files=files,
        channel_id=settings.reporting_channel_id,
        message="This is a test upload",
    )
    print(result["files"])
    assert 0
