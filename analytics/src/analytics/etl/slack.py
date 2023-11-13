from dataclasses import dataclass

from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError


@dataclass
class FileMapping:
    """"""

    file_path: str
    file_name: str


def fetch_slack_channel_info(client: WebClient, channel_id: str):
    """Get info about a slack channel"""
    try:
        # Call the conversations.info method using the WebClient
        result = client.conversations_info(channel=channel_id)
        return result
    except SlackApiError as e:
        print(f"Error fetching conversations: {e}")
    response = client.conversations_list(types="public_channel")
    return response


def upload_file_to_slack_channel(
    client: WebClient,
    channel_id: str,
    files: list[FileMapping],
    message: str,
) -> None:
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
    response = client.conversations_list(types="public_channel")
    return response
