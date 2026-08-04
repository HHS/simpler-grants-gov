from email.message import EmailMessage
from unittest.mock import Mock

import pytest

import src.adapters.aws.local_email_adapter as local_email_adapter
from src.adapters.aws.local_email_adapter import (
    LocalEmailConfig,
    send_email_to_address,
    send_local_email,
    send_local_email_if_enabled,
)


class FakeSMTP:
    message: EmailMessage | None = None
    from_address: str | None = None
    to_addresses: list[str] | None = None
    host: str | None = None
    port: int | None = None
    timeout: float | None = None

    def __init__(self, host: str, port: int, timeout: float):
        self.__class__.host = host
        self.__class__.port = port
        self.__class__.timeout = timeout

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        return None

    def send_message(
        self,
        message: EmailMessage,
        from_addr: str,
        to_addrs: list[str],
    ) -> None:
        self.__class__.message = message
        self.__class__.from_address = from_addr
        self.__class__.to_addresses = to_addrs


def test_send_local_email_preserves_message_metadata(monkeypatch):
    monkeypatch.setattr(local_email_adapter.smtplib, "SMTP", FakeSMTP)
    monkeypatch.setattr(local_email_adapter, "is_local_aws", lambda: True)

    config = LocalEmailConfig(
        ENABLE_LOCAL_EMAIL_CAPTURE=True,
        ENVIRONMENT="local",
        LOCAL_EMAIL_SMTP_HOST="mailpit",
        LOCAL_EMAIL_SMTP_PORT=1025,
        LOCAL_EMAIL_SMTP_TIMEOUT_SECONDS=3,
        AWS_SES_FROM_EMAIL="sender@example.com",
    )

    message_id = send_local_email(
        to_address="recipient@example.com",
        subject="A local message",
        message="<p>Hello from local email</p>",
        trace_id="trace-123",
        cc_addresses=["copy@example.com"],
        bcc_addresses=["hidden@example.com"],
        headers={"Reply-To": "reply@example.com", "X-Campaign": "local-test"},
        config=config,
    )

    assert FakeSMTP.host == "mailpit"
    assert FakeSMTP.port == 1025
    assert FakeSMTP.timeout == 3
    assert FakeSMTP.from_address == "sender@example.com"
    assert FakeSMTP.to_addresses == [
        "recipient@example.com",
        "copy@example.com",
        "hidden@example.com",
    ]

    email_message = FakeSMTP.message
    assert email_message is not None
    assert email_message["To"] == "recipient@example.com"
    assert email_message["From"] == "sender@example.com"
    assert email_message["Subject"] == "A local message"
    assert email_message["Cc"] == "copy@example.com"
    assert email_message["Bcc"] is None
    assert email_message["Date"] is not None
    assert email_message["Message-ID"] == message_id
    assert email_message["X-Simpler-Trace-Id"] == "trace-123"
    assert email_message["Reply-To"] == "reply@example.com"
    assert email_message["X-Campaign"] == "local-test"
    assert email_message.get_body(preferencelist=("html",)).get_content().strip() == (
        "<p>Hello from local email</p>"
    )


@pytest.mark.parametrize(
    ("environment", "local_aws"),
    [("dev", True), ("staging", True), ("prod", True), ("local", False)],
)
def test_send_local_email_refuses_non_local_environments(monkeypatch, environment, local_aws):
    monkeypatch.setattr(local_email_adapter, "is_local_aws", lambda: local_aws)
    monkeypatch.setattr(local_email_adapter.smtplib, "SMTP", FakeSMTP)
    config = LocalEmailConfig(
        ENABLE_LOCAL_EMAIL_CAPTURE=True,
        ENVIRONMENT=environment,
        LOCAL_EMAIL_SMTP_HOST="mailpit",
    )

    with pytest.raises(
        RuntimeError,
        match="Local email capture requires ENVIRONMENT=local and IS_LOCAL_AWS enabled",
    ):
        send_local_email(
            to_address="recipient@example.com",
            subject="Should not send",
            message="No delivery",
            trace_id="trace-456",
            config=config,
        )


def test_send_local_email_refuses_external_smtp_host(monkeypatch):
    monkeypatch.setattr(local_email_adapter, "is_local_aws", lambda: True)
    config = LocalEmailConfig(
        ENABLE_LOCAL_EMAIL_CAPTURE=True,
        ENVIRONMENT="local",
        LOCAL_EMAIL_SMTP_HOST="smtp.example.com",
    )

    with pytest.raises(
        RuntimeError,
        match="Local email capture SMTP host must be Mailpit or a loopback address",
    ):
        send_local_email(
            to_address="recipient@example.com",
            subject="Should not send",
            message="No delivery",
            trace_id="trace-789",
            config=config,
        )


def test_send_local_email_requires_explicit_environment(monkeypatch):
    monkeypatch.setattr(local_email_adapter, "is_local_aws", lambda: True)
    config = LocalEmailConfig(
        ENABLE_LOCAL_EMAIL_CAPTURE=True,
        ENVIRONMENT=None,
        LOCAL_EMAIL_SMTP_HOST="localhost",
    )

    with pytest.raises(
        RuntimeError,
        match="Local email capture requires ENVIRONMENT=local and IS_LOCAL_AWS enabled",
    ):
        send_local_email(
            to_address="recipient@example.com",
            subject="Should not send",
            message="No delivery",
            trace_id="trace-000",
            config=config,
        )


def test_send_local_email_requires_explicit_enablement(monkeypatch):
    monkeypatch.setattr(local_email_adapter, "is_local_aws", lambda: True)
    config = LocalEmailConfig(
        ENABLE_LOCAL_EMAIL_CAPTURE=False,
        ENVIRONMENT="local",
        LOCAL_EMAIL_SMTP_HOST="localhost",
    )

    with pytest.raises(RuntimeError, match="Local email capture must be explicitly enabled"):
        send_local_email(
            to_address="recipient@example.com",
            subject="Should not send",
            message="No delivery",
            trace_id="trace-disabled",
            config=config,
        )


def test_send_local_email_if_disabled_does_not_connect(monkeypatch):
    def fail_if_called(*args, **kwargs):
        raise AssertionError("SMTP must not be constructed when capture is disabled")

    monkeypatch.setattr(local_email_adapter.smtplib, "SMTP", fail_if_called)
    config = LocalEmailConfig(
        ENABLE_LOCAL_EMAIL_CAPTURE=False,
        ENVIRONMENT="local",
        LOCAL_EMAIL_SMTP_HOST="localhost",
    )

    assert (
        send_local_email_if_enabled(
            to_address="recipient@example.com",
            subject="Use the configured provider",
            message="No local delivery",
            trace_id="trace-fallback",
            config=config,
        )
        is None
    )


def test_send_email_to_address_uses_local_capture_when_enabled(monkeypatch):
    local_sender = Mock(return_value="<local-message-id>")
    ses_sender = Mock()
    monkeypatch.setattr(local_email_adapter, "send_local_email", local_sender)
    monkeypatch.setattr(local_email_adapter, "send_ses_email", ses_sender)
    config = LocalEmailConfig(
        ENABLE_LOCAL_EMAIL_CAPTURE=True,
        ENVIRONMENT="local",
        LOCAL_EMAIL_SMTP_HOST="mailpit",
    )

    message_id = send_email_to_address(
        to_address="recipient@example.com",
        subject="A local message",
        message="<p>Hello from local email</p>",
        trace_id="trace-local",
        cc_addresses=["copy@example.com"],
        bcc_addresses=["hidden@example.com"],
        headers={"Reply-To": "reply@example.com"},
        config=config,
    )

    assert message_id == "<local-message-id>"
    local_sender.assert_called_once_with(
        to_address="recipient@example.com",
        subject="A local message",
        message="<p>Hello from local email</p>",
        trace_id="trace-local",
        cc_addresses=["copy@example.com"],
        bcc_addresses=["hidden@example.com"],
        headers={"Reply-To": "reply@example.com"},
        config=config,
    )
    ses_sender.assert_not_called()


def test_send_email_to_address_uses_ses_when_local_capture_is_disabled(monkeypatch):
    local_sender = Mock()
    ses_sender = Mock(return_value="<ses-message-id>")
    monkeypatch.setattr(local_email_adapter, "send_local_email", local_sender)
    monkeypatch.setattr(local_email_adapter, "send_ses_email", ses_sender)
    config = LocalEmailConfig(
        ENABLE_LOCAL_EMAIL_CAPTURE=False,
        ENVIRONMENT="local",
        LOCAL_EMAIL_SMTP_HOST="mailpit",
    )

    message_id = send_email_to_address(
        to_address="recipient@example.com",
        subject="An SES message",
        message="<p>Hello from SES</p>",
        trace_id="trace-ses",
        config=config,
    )

    assert message_id == "<ses-message-id>"
    local_sender.assert_not_called()
    ses_sender.assert_called_once_with(
        to_address="recipient@example.com",
        subject="An SES message",
        message="<p>Hello from SES</p>",
    )


def test_send_email_to_address_does_not_fall_back_to_ses_when_local_capture_fails(
    monkeypatch,
):
    local_sender = Mock(side_effect=RuntimeError("Local capture failed"))
    ses_sender = Mock()
    monkeypatch.setattr(local_email_adapter, "send_local_email", local_sender)
    monkeypatch.setattr(local_email_adapter, "send_ses_email", ses_sender)
    config = LocalEmailConfig(
        ENABLE_LOCAL_EMAIL_CAPTURE=True,
        ENVIRONMENT="local",
        LOCAL_EMAIL_SMTP_HOST="mailpit",
    )

    with pytest.raises(RuntimeError, match="Local capture failed"):
        send_email_to_address(
            to_address="recipient@example.com",
            subject="Do not send through SES",
            message="Local capture should fail closed.",
            trace_id="trace-fail-closed",
            config=config,
        )

    local_sender.assert_called_once()
    ses_sender.assert_not_called()


@pytest.mark.parametrize(
    "protected_header",
    [
        "To",
        "From",
        "Subject",
        "Cc",
        "Bcc",
        "Date",
        "Message-ID",
        "MIME-Version",
        "Content-Type",
        "Content-Transfer-Encoding",
        "X-Simpler-Trace-Id",
    ],
)
def test_send_local_email_refuses_protected_headers(monkeypatch, protected_header):
    monkeypatch.setattr(local_email_adapter, "is_local_aws", lambda: True)
    config = LocalEmailConfig(
        ENABLE_LOCAL_EMAIL_CAPTURE=True,
        ENVIRONMENT="local",
        LOCAL_EMAIL_SMTP_HOST="localhost",
    )

    with pytest.raises(ValueError, match="Cannot override protected email header"):
        send_local_email(
            to_address="recipient@example.com",
            subject="Protected headers",
            message="No delivery",
            trace_id="trace-protected",
            headers={protected_header: "override"},
            config=config,
        )


def test_send_local_email_refuses_newlines_in_header_values(monkeypatch):
    monkeypatch.setattr(local_email_adapter, "is_local_aws", lambda: True)
    config = LocalEmailConfig(
        ENABLE_LOCAL_EMAIL_CAPTURE=True,
        ENVIRONMENT="local",
        LOCAL_EMAIL_SMTP_HOST="localhost",
    )

    with pytest.raises(ValueError, match="linefeed|carriage return|newline"):
        send_local_email(
            to_address="recipient@example.com",
            subject="Header injection",
            message="No delivery",
            trace_id="trace-newline",
            headers={"X-Test": "value\nBcc: attacker@example.com"},
            config=config,
        )
