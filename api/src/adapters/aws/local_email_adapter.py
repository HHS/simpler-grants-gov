import smtplib
from email.message import EmailMessage
from email.utils import formatdate, make_msgid

from grants_shared.adapters.aws.aws_session import is_local_aws
from grants_shared.adapters.aws.ses_adapter import send_email as send_ses_email
from pydantic import Field

from src.util.env_config import PydanticBaseEnvConfig


class LocalEmailConfig(PydanticBaseEnvConfig):
    enabled: bool = Field(default=False, alias="ENABLE_LOCAL_EMAIL_CAPTURE")
    environment: str | None = Field(default=None, alias="ENVIRONMENT")
    smtp_host: str = Field(default="localhost", alias="LOCAL_EMAIL_SMTP_HOST")
    smtp_port: int = Field(default=1025, ge=1, le=65535, alias="LOCAL_EMAIL_SMTP_PORT")
    smtp_timeout_seconds: float = Field(default=5.0, gt=0, alias="LOCAL_EMAIL_SMTP_TIMEOUT_SECONDS")
    from_address: str = Field(default="noreply@grants.gov", alias="AWS_SES_FROM_EMAIL")


_ALLOWED_SMTP_HOSTS = frozenset({"mailpit", "localhost", "127.0.0.1", "::1"})
_PROTECTED_HEADERS = (
    "to",
    "from",
    "subject",
    "cc",
    "bcc",
    "date",
    "message-id",
    "mime-version",
    "content-type",
    "content-transfer-encoding",
    "x-simpler-trace-id",
)


def send_email_to_address(
    to_address: str,
    subject: str,
    message: str,
    trace_id: str,
    cc_addresses: list[str] | None = None,
    bcc_addresses: list[str] | None = None,
    headers: dict[str, str] | None = None,
    config: LocalEmailConfig | None = None,
) -> str:
    """Send an email using local capture when enabled, otherwise use SESv2."""
    if config is None:
        config = LocalEmailConfig()

    if config.enabled:
        return send_local_email(
            to_address=to_address,
            subject=subject,
            message=message,
            trace_id=trace_id,
            cc_addresses=cc_addresses,
            bcc_addresses=bcc_addresses,
            headers=headers,
            config=config,
        )

    return send_ses_email(
        to_address=to_address,
        subject=subject,
        message=message,
    )


def send_local_email_if_enabled(
    to_address: str,
    subject: str,
    message: str,
    trace_id: str,
    cc_addresses: list[str] | None = None,
    bcc_addresses: list[str] | None = None,
    headers: dict[str, str] | None = None,
    config: LocalEmailConfig | None = None,
) -> str | None:
    """Capture an email locally when the local transport is explicitly enabled."""
    if config is None:
        config = LocalEmailConfig()

    if not config.enabled:
        return None

    return send_local_email(
        to_address=to_address,
        subject=subject,
        message=message,
        trace_id=trace_id,
        cc_addresses=cc_addresses,
        bcc_addresses=bcc_addresses,
        headers=headers,
        config=config,
    )


def send_local_email(
    to_address: str,
    subject: str,
    message: str,
    trace_id: str,
    cc_addresses: list[str] | None = None,
    bcc_addresses: list[str] | None = None,
    headers: dict[str, str] | None = None,
    config: LocalEmailConfig | None = None,
) -> str:
    """Deliver an email to the local SMTP capture service.

    Local SMTP is deliberately fail-closed. Even if its environment variables
    drift into a deployed environment, it cannot replace the real provider.
    """
    if config is None:
        config = LocalEmailConfig()

    if not config.enabled:
        raise RuntimeError("Local email capture must be explicitly enabled")

    if config.environment != "local" or not is_local_aws():
        raise RuntimeError(
            "Local email capture requires ENVIRONMENT=local and IS_LOCAL_AWS enabled"
        )

    smtp_host = config.smtp_host.strip().lower()
    if smtp_host not in _ALLOWED_SMTP_HOSTS:
        raise RuntimeError("Local email capture SMTP host must be Mailpit or a loopback address")

    cc_addresses = cc_addresses or []
    bcc_addresses = bcc_addresses or []
    headers = headers or {}

    email_message = EmailMessage()
    email_message["To"] = to_address
    email_message["From"] = config.from_address
    email_message["Subject"] = subject
    if cc_addresses:
        email_message["Cc"] = ", ".join(cc_addresses)
    email_message["Date"] = formatdate(localtime=False, usegmt=True)
    email_message["Message-ID"] = make_msgid()
    email_message["X-Simpler-Trace-Id"] = trace_id
    for header_name, header_value in headers.items():
        if header_name.lower() in _PROTECTED_HEADERS:
            raise ValueError(f"Cannot override protected email header: {header_name}")
        email_message[header_name] = header_value
    email_message.set_content(message)
    email_message.add_alternative(message, subtype="html")

    with smtplib.SMTP(
        host=smtp_host,
        port=config.smtp_port,
        timeout=config.smtp_timeout_seconds,
    ) as smtp_client:
        smtp_client.send_message(
            email_message,
            from_addr=config.from_address,
            # Bcc is preserved in Mailpit's SMTP envelope without leaking it
            # into the message headers, matching real email behavior.
            to_addrs=[to_address, *cc_addresses, *bcc_addresses],
        )

    return str(email_message["Message-ID"])
