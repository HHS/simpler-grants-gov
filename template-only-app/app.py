import logging
import os
from datetime import datetime

import click
from flask import Flask, redirect, render_template, request

import notifications
import sms_notifications
import storage
from db import get_db_connection
from feature_flags import is_feature_enabled

logging.basicConfig()
logger = logging.getLogger()
logger.setLevel(logging.INFO)

app = Flask(__name__)


def main():
    host = os.environ.get("HOST")
    port = os.environ.get("PORT")
    logger.info("Running Flask app on host %s and port %s", host, port)
    app.run(host=host, port=port)


@app.route("/")
def hello_world():
    return render_template("index.html")


@app.route("/health")
def health():
    conn = get_db_connection()
    conn.execute("SELECT 1")
    return {
        "status": "healthy",
        "version": os.environ.get("IMAGE_TAG"),
    }


@app.route("/migrations")
def migrations():
    conn = get_db_connection()
    cur = conn.execute("SELECT last_migration_date FROM migrations")
    row = cur.fetchone
    if row is None:
        return "No migrations run"
    else:
        last_migration_date = cur.fetchone()[0]
        return f"Last migration on {last_migration_date}"


@app.route("/feature-flags")
def feature_flags():
    foo_status = "enabled" if is_feature_enabled("FOO") else "disabled"
    bar_status = "enabled" if is_feature_enabled("BAR") else "disabled"
    return f"<p>Feature FOO is {foo_status}</p><p>Feature BAR is {bar_status}</p>"


@app.route("/document-upload")
def document_upload():
    path = f"uploads/{datetime.now().date()}/${{filename}}"
    upload_url, fields = storage.create_upload_url(path)
    additional_fields = "".join(
        [
            f'<input type="hidden" name="{name}" value="{value}">'
            for name, value in fields.items()
        ]
    )
    # Note: Additional fields should come first before the file and submit button
    return f'<form method="post" action="{upload_url}" enctype="multipart/form-data">{additional_fields}<input type="file" name="file"><input type="submit"></form>'


@app.route("/email-notifications", methods=["GET", "POST"])
def email_notifications():
    if request.method == "POST":
        to = request.form["to"]
        subject = "Test notification"
        message = "This is a system generated test notification. If you received this email in error, please ignore it."
        logger.info("Sending test email to %s", to)
        notifications.send_email(to, subject, message)
    return f'<form method="post">Send test email to:<input type="email" name="to"><input type="submit"></form>'


@app.route("/secrets")
def secrets():
    secret_sauce = os.environ["SECRET_SAUCE"]
    random_secret = os.environ["RANDOM_SECRET"]
    return f'The secret sauce is "{secret_sauce}".<br> The random secret is "{random_secret}".'


@app.cli.command("etl", help="Run ETL job")
@click.argument("input")
def etl(input):
    # input should be something like "etl/input/somefile.ext"
    assert input.startswith("etl/input/")
    output = input.replace("/input/", "/output/")
    data = storage.download_file(input)
    storage.upload_file(output, data)


@app.cli.command("cron", help="Run cron job")
def cron():
    conn = get_db_connection()
    conn.execute("SELECT 1")
    print("Hello from cron job")

@app.route("/sms-notifications", methods=["GET", "POST"])
def sms_notifications_page():
    logger.info("Accessed /sms-notifications endpoint with method %s", request.method)
    if request.method == "POST":
        phone_number = request.form.get("phone_number")
        message = "This is a test SMS from Strata Platform."

        # AWS guidelines require that applications verify users have explicitly opted in
        # before sending SMS messages. Sending to numbers that have not opted in can
        # result in violations of carrier policies and AWS End User Messaging SMS terms of service.
        # Here we check the phone number against a recordset of opt-in numbers.
        # OPT_IN_NUMBERS is used as the recordset in this example, but in production
        # this information should come from a persistent data source (e.g. a database).
        # When OPT_IN_NUMBERS is not set, only the simulator numbers ["+14254147755", "+14254147167"]
        # are permitted as safe test targets.
        opt_in_env = os.environ.get("OPT_IN_NUMBERS")
        if opt_in_env is not None:
            allowed_numbers = [n.strip() for n in opt_in_env.split(",")]
        else:
            allowed_numbers = ["+14254147755", "+14254147167"]
        if phone_number not in allowed_numbers:
            return f"Cannot send SMS: {phone_number} is not in the opt-in list."

        # Check opt-out status
        opt_out_status = sms_notifications.check_opt_out_status(phone_number)
        if opt_out_status.get("opted_out"):
            return f"Cannot send SMS: {phone_number} has opted out of messages."

        # Send SMS
        result = sms_notifications.send_sms(phone_number, message)
        logger.info("SMS send result: %s", result)

        if result["success"]:
            return f"SMS sent successfully to {phone_number}. Message ID: {result['message_id']}"
        else:
            return f"Failed to send SMS: {result['error']} (Code: {result.get('error_code', 'Unknown')})"

    return render_template("sms_form.html")

if __name__ == "__main__":
    main()
