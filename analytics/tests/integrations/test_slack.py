"""Test the code in analytics.etl.slack."""
from pathlib import Path  # noqa: I001

import pytest
from slack_sdk import WebClient

from analytics.etl.slack import FileMapping, SlackBot
from config import settings

client = WebClient(token=settings.slack_bot_token)


@pytest.fixture(name="slackbot")
def mock_slackbot() -> SlackBot:
    """Create a SlackBot instance for testing."""
    return SlackBot(client=client)


def test_fetch_slack_channels(slackbot: SlackBot):
    """The fetch_slack_channels() function should execute correctly."""
    result = slackbot.fetch_slack_channel_info(channel_id=settings.reporting_channel_id)
    assert result["ok"] is True
    assert result["channel"]["name"] == "z_bot-sprint-reporting-test"


def test_upload_files_to_slack_channel(slackbot: SlackBot):
    """The upload_files_to_slack_channel() function should execute correctly."""
    # setup - create test files to upload
    files = [
        FileMapping(path="data/test1.txt", name="test1.txt"),
        FileMapping(path="data/test2.txt", name="test2.txt"),
    ]
    for _file in files:
        test_dir = Path(_file.path).parent
        test_dir.mkdir(exist_ok=True, parents=True)
        with open(_file.path, "w", encoding="utf-8") as f:
            f.write(_file.name)
    # execution - run the upload
    result = slackbot.upload_file_to_slack_channel(
        files=files,
        channel_id=settings.reporting_channel_id,
        message="This is a test upload",
    )
    assert result["ok"] is True
    assert result["files"] is not None
