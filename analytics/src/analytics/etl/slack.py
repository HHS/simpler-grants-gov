"""A series of ETL functions that allows us to read and write data to slack"""
from dataclasses import dataclass
from typing import Optional

from slack_sdk import WebClient
from slack_sdk.web.slack_response import SlackResponse
from slack_sdk.errors import SlackApiError


@dataclass
class FileMapping:
    """A dataclass that maps file path to file name"""

    file_path: str
    file_name: str


def fetch_slack_channel_info(
    client: WebClient,
    channel_id: str,
) -> Optional[SlackResponse]:
    """Get info about a slack channel"""
    try:
        # Call the conversations.info method using the WebClient
        response = client.conversations_info(channel=channel_id)
        return response
    except SlackApiError as e:
        print(f"Error fetching conversations: {e}")
    return None


def upload_file_to_slack_channel(
    client: WebClient,
    channel_id: str,
    files: list[FileMapping],
    message: str,
) -> Optional[SlackResponse]:
    """Post to a slack channel"""
    try:
        response = client.files_upload_v2(
            file_uploads=[{"file": f.file_path, "title": f.file_name} for f in files],
            channel=channel_id,
            initial_comment=message,
        )
        return response
    except SlackApiError as e:
        print(f"Error fetching conversations: {e}")
    return None
