import os
import boto3

def send_email(to: str, subject: str, message: str):
    ses_client = boto3.client("sesv2")
    from_email = os.environ["AWS_SES_FROM_EMAIL"]

    response = ses_client.send_email(
        FromEmailAddress=from_email,
        Destination={
            "ToAddresses": [to]
        },
        Content={
            "Simple": {
                "Subject": {
                    "Data": subject,
                    "Charset": "UTF-8"
                },
                "Body": {
                    "Html": {
                        "Data": message,
                        "Charset": "UTF-8"
                    },
                    "Text": {
                        "Data": message,
                        "Charset": "UTF-8"
                    }
                }
            }
        }
    )
    print(response)

    return response
