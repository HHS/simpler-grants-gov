import os

import pytest
from moto.core import DEFAULT_ACCOUNT_ID
from moto.ses.models import ses_backends

import grants_shared.adapters.aws.aws_session as aws_session_module
from grants_shared.adapters.aws import send_email


def test_send_email_success(ses_client):
    """Test successfully sending an email via SES"""
    to_email = "recipient@example.com"
    message_subject = "Test Subject"
    message_body = "This is a test email message"

    message_id = send_email(
        to_address=to_email,
        subject=message_subject,
        message=message_body,
        ses_client=ses_client,
    )

    assert message_id is not None
    ses_backend = ses_backends[DEFAULT_ACCOUNT_ID][ses_client.meta.region_name]
    assert len(ses_backend.sent_messages) == 1

    sent_email = ses_backend.sent_messages[0]
    assert sent_email.source == os.getenv("AWS_SES_FROM_EMAIL")
    assert to_email in sent_email.destinations["ToAddresses"]
    assert sent_email.subject == message_subject
    assert sent_email.body == message_body


def test_send_email_html_special_characters(ses_client):
    """Test sending emails with HTML content and special characters in subject and body"""
    to_email = "recipient@example.com"
    subject = "Test with émojis 🎉 and spëcial çharacters"
    message = """<html>
                    <body>
                        <h1>Test Email with Special Characters</h1>
                        <p>Message with special characters: €, £, ¥, ñ, ü</p>
                        <p>Emojis: 🚀 📧 ✅ 🎉</p>
                        <ul>
                            <li>Currency: € £ ¥</li>
                            <li>Accents: é ñ ü ç</li>
                            <li>Symbols: © ® ™</li>
                        </ul>
                    </body>
                </html>"""

    message_id = send_email(
        to_address=to_email,
        subject=subject,
        message=message,
        ses_client=ses_client,
    )

    assert message_id is not None

    # Verify special characters and HTML content are preserved correctly
    ses_backend = ses_backends[DEFAULT_ACCOUNT_ID][ses_client.meta.region_name]
    sent_email = ses_backend.sent_messages[0]

    # Verify subject with special characters
    assert sent_email.subject == subject
    assert "🎉" in sent_email.subject
    assert "émojis" in sent_email.subject

    # Verify HTML content is preserved
    assert sent_email.body == message
    assert "<html>" in sent_email.body
    assert "<h1>Test Email with Special Characters</h1>" in sent_email.body

    # Verify special characters in HTML body
    assert "€" in sent_email.body
    assert "🚀" in sent_email.body
    assert "ñ" in sent_email.body
    assert "©" in sent_email.body


def test_send_email_unverified_sender(ses_client):
    """Test that sending from an unverified email address fails"""
    to_email = "recipient@example.com"
    message_subject = "Test Subject"
    message_body = "This is a test email message"

    # Delete the verified email identity to simulate unverified sender
    ses_client.delete_email_identity(EmailIdentity=os.getenv("AWS_SES_FROM_EMAIL"))

    with pytest.raises(Exception) as exc_info:
        send_email(
            to_address=to_email,
            subject=message_subject,
            message=message_body,
            ses_client=ses_client,
        )

    # "Email address not verified" is partial of the error message
    assert "Email address not verified" in str(exc_info.value)


def test_send_email_multiple_recipients(ses_client):
    """Test sending emails to multiple recipients sequentially"""
    recipients = ["recipient1@example.com", "recipient2@example.com", "recipient3@example.com"]
    message_subject = "Test Subject"
    message_body = "This is a test email message"

    message_ids = []
    for recipient in recipients:
        message_id = send_email(
            to_address=recipient,
            subject=message_subject,
            message=message_body,
            ses_client=ses_client,
        )
        message_ids.append(message_id)

    ses_backend = ses_backends[DEFAULT_ACCOUNT_ID][ses_client.meta.region_name]
    assert len(ses_backend.sent_messages) == len(recipients)
    assert all(isinstance(msg.id, str) and len(msg.id) > 0 for msg in ses_backend.sent_messages)


def test_send_email_local_environment(monkeypatch):
    """Test that in local environment, emails are not actually sent"""
    monkeypatch.setenv("IS_LOCAL_AWS", "1")

    # Clear the cached config so it picks up the new environment variable
    aws_session_module._aws_config = None

    message_id = send_email(
        to_address="test@example.com",
        subject="Local Test",
        message="This should not actually send",
    )

    assert message_id == "local-mock-message-id"
