"""Integrate with Slack to post messages and get channel information."""

import functools
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
from slack_sdk.web.slack_response import SlackResponse


@dataclass
class FileMapping:
    """A dataclass that maps file path to file name."""

    path: str
    name: str


def slack_api_error_handler(slackbot_api_call: Callable) -> Callable:
    """Wrap SlackBot methods with a try-except block."""

    @functools.wraps(slackbot_api_call)
    def try_to_make_slackbot_api_call_and_catch_error(
        *args: Any,  # noqa: ANN401
        **kwargs: Any,  # noqa: ANN401
    ) -> SlackResponse | None:
        """Try to make a slack API call, and print the error if it fails."""
        try:
            return slackbot_api_call(*args, **kwargs)
        except SlackApiError as e:
            print(e)
            return None

    return try_to_make_slackbot_api_call_and_catch_error


class SlackBot:
    """Interact with slack using a slack bot."""

    def __init__(self, client: WebClient) -> None:
        """Instantiate the SlackBot class."""
        self.client = client

    @slack_api_error_handler
    def fetch_slack_channel_info(self, channel_id: str) -> SlackResponse | None:
        """Get info about a slack channel."""
        # Call the conversations.info method using the WebClient
        return self.client.conversations_info(channel=channel_id)

    @slack_api_error_handler
    def upload_files_to_slack_channel(
        self,
        channel_id: str,
        files: list[FileMapping],
        message: str,
    ) -> SlackResponse | None:
        """Upload files to a slack channel with a message."""
        return self.client.files_upload_v2(
            file_uploads=[{"file": f.path, "title": f.name} for f in files],
            channel=channel_id,
            initial_comment=message,
        )
