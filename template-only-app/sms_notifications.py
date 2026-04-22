import logging
import os
import boto3
import json
from botocore.exceptions import ClientError

logging.basicConfig()
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def send_sms(phone_number, message, message_type="TRANSACTIONAL"):
    """
    Send SMS via AWS End User Messaging (PinpointSMSVoiceV2)
    """
    try:
        logger.info("Initializing AWS Pinpoint SMS Voice V2 client")
        client = boto3.client("pinpoint-sms-voice-v2")
        phone_pool_id = os.environ.get("AWS_SMS_PHONE_POOL_ID")
        configuration_set = os.environ.get("AWS_SMS_CONFIGURATION_SET_NAME")
        logger.info("Sending SMS Using Configuration Set: %s", configuration_set)
        logger.info("Sending SMS Using Phone Pool ID: %s", phone_pool_id)

        params = {
            "DestinationPhoneNumber": phone_number,
            "OriginationIdentity": phone_pool_id,
            "MessageBody": message,
            "MessageType": message_type
        }

        # Add configuration set for tracking
        if configuration_set:
            params["ConfigurationSetName"] = configuration_set

        # Add context for tracking (optional)
        params["Context"] = {
            "ApplicationName": "template-app",
            "Environment": "dev"
        }

        if check_opt_out_status(phone_number).get("opted_out"):
            logger.warning("Phone number %s has opted out of SMS messages. Aborting send.", phone_number)
            return {
                "success": False,
                "error": f"Phone number {phone_number} has opted out of SMS messages."
            }

        response = client.send_text_message(**params)

        return {
            "success": True,
            "message_id": response.get("MessageId"),
            "response": response
        }

    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        error_message = e.response["Error"]["Message"]
        logger.error(f"ClientError: {error_code} - {error_message}")

        return {
            "success": False,
            "error": error_message,
            "error_code": error_code,
            "details": str(e)
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def check_opt_out_status(phone_number):
    """
    Check if a phone number is opted out
    """
    try:
        client = boto3.client("pinpoint-sms-voice-v2")

        response = client.describe_opted_out_numbers(
            OptOutListName="default",
            OptedOutNumbers=[phone_number]
        )

        opted_out_numbers = response.get("OptedOutNumbers", [])
        is_opted_out = any(num["OptedOutNumber"] == phone_number for num in opted_out_numbers)

        return {"opted_out": is_opted_out}

    except Exception as e:
        return {"error": str(e)}
