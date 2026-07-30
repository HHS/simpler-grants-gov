from unittest.mock import Mock

import src.adapters.aws.pinpoint_adapter as pinpoint_adapter


def test_send_pinpoint_email_raw_returns_local_capture_without_creating_aws_client(monkeypatch):
    local_capture = Mock(return_value="<local-message-id@example.com>")
    get_pinpoint_client = Mock(side_effect=AssertionError("AWS client must not be created"))
    monkeypatch.setattr(pinpoint_adapter, "send_local_email_if_enabled", local_capture)
    monkeypatch.setattr(pinpoint_adapter, "get_pinpoint_client", get_pinpoint_client)

    response = pinpoint_adapter.send_pinpoint_email_raw(
        to_address="recipient@example.com",
        subject="Captured locally",
        message="<p>Local message</p>",
        app_id="local-app-id",
        trace_id="trace-local-123",
    )

    result = response.results["recipient@example.com"]
    assert result.delivery_status == "SUCCESSFUL"
    assert result.status_code == 200
    assert result.status_message == "Captured by local SMTP server"
    assert result.message_id == "<local-message-id@example.com>"
    assert result.trace_id == "trace-local-123"
    local_capture.assert_called_once_with(
        to_address="recipient@example.com",
        subject="Captured locally",
        message="<p>Local message</p>",
        trace_id="trace-local-123",
    )
    get_pinpoint_client.assert_not_called()


def test_send_pinpoint_email_raw_uses_existing_mock_when_local_capture_disabled(monkeypatch):
    local_capture = Mock(return_value=None)
    pinpoint_client = Mock()
    get_pinpoint_client = Mock(return_value=pinpoint_client)
    monkeypatch.setattr(pinpoint_adapter, "send_local_email_if_enabled", local_capture)
    monkeypatch.setattr(pinpoint_adapter, "get_pinpoint_client", get_pinpoint_client)
    monkeypatch.setattr(pinpoint_adapter, "is_local_aws", lambda: True)
    pinpoint_adapter._clear_mock_responses()

    try:
        response = pinpoint_adapter.send_pinpoint_email_raw(
            to_address="recipient@example.com",
            subject="Use the mock",
            message="<p>Mock message</p>",
            app_id="local-app-id",
            trace_id="trace-mock-456",
        )
        mock_responses = pinpoint_adapter._get_mock_responses()
    finally:
        pinpoint_adapter._clear_mock_responses()

    result = response.results["recipient@example.com"]
    assert result.delivery_status == "SUCCESSFUL"
    assert result.status_code == 200
    assert result.status_message == "Ok"
    assert result.message_id != "message-not-sent"
    assert result.trace_id is None

    assert len(mock_responses) == 1
    request, mock_response = mock_responses[0]
    assert mock_response == response
    assert request["ApplicationId"] == "local-app-id"
    assert request["MessageRequest"]["Addresses"] == {
        "recipient@example.com": {"ChannelType": "EMAIL"}
    }
    assert request["MessageRequest"]["TraceId"] == "trace-mock-456"
    assert request["MessageRequest"]["MessageConfiguration"]["EmailMessage"] == {
        "SimpleEmail": {
            "Subject": {"Charset": "UTF-8", "Data": "Use the mock"},
            "HtmlPart": {"Charset": "UTF-8", "Data": "<p>Mock message</p>"},
            "TextPart": {"Charset": "UTF-8", "Data": "<p>Mock message</p>"},
        }
    }
    local_capture.assert_called_once_with(
        to_address="recipient@example.com",
        subject="Use the mock",
        message="<p>Mock message</p>",
        trace_id="trace-mock-456",
    )
    get_pinpoint_client.assert_called_once_with()
    pinpoint_client.send_messages.assert_not_called()
