import os
import boto3

def send_email(to: str, subject: str, message: str):
    pinpoint_client = boto3.client("pinpoint")
    app_id = os.environ["AWS_PINPOINT_APP_ID"]

    response = pinpoint_client.send_messages(
        ApplicationId=app_id,
        MessageRequest={
            "Addresses": {
                to: {
                    "ChannelType": "EMAIL"
                }
            },
            "MessageConfiguration": {
                "EmailMessage": {
                    "SimpleEmail": {
                        "Subject": {
                            "Charset": "UTF-8",
                            "Data": subject
                        },
                        "HtmlPart": {
                            "Charset": "UTF-8",
                            "Data": message
                        },
                        "TextPart": {
                            "Charset": "UTF-8",
                            "Data": message
                        }
                    }
                }
            }
        }
    )
    print(response)

    return response
