# This module manages AWS End User Messaging SMS phone pool resources using CloudFormation.
# It only creates the SMS Phone Number and Phone Pool. Configuration sets are handled separately.
data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

locals {
  phone_number_arn_base = (
    "arn:aws:sms-voice:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:phone-number"
  )
  registration_id_arn = var.sms_sender_phone_number_registration_id != null ? "${local.phone_number_arn_base}/${var.sms_sender_phone_number_registration_id}" : null

  mandatory_keywords = {
    STOP = {
      Message = "Reply STOP to unsubscribe"
    }
    HELP = {
      Message = "Reply HELP for help"
    }
  }

  phone_number_base_properties = {
    IsoCountryCode     = "US"
    NumberCapabilities = ["SMS"]
    MandatoryKeywords  = local.mandatory_keywords
  }
}

# CloudFormation stack for SMS phone pool and phone number
# Every phone pool must have at least one phone number, so we create both resources in the same stack.
resource "aws_cloudformation_stack" "sms_phone_pool" {
  # checkov:skip=CKV_AWS_124: CloudFormation stack event notifications via SNS not required; stack lifecycle is managed by Terraform and errors surface through Terraform output.
  name = "${var.name}-phone-pool"

  timeout_in_minutes = 5
  on_failure         = "ROLLBACK"

  template_body = jsonencode({
    Resources = {
      SmsPhoneNumber = {
        Type = "AWS::SMSVOICE::PhoneNumber"
        Properties = merge(
          local.phone_number_base_properties,
          var.sms_sender_phone_number_registration_id != null ? {
            # Use registration ID to create a registered phone number
            RegistrationId = var.sms_sender_phone_number_registration_id
            NumberType     = var.sms_number_type
            } : {
            # Create a new simulator phone number
            NumberType = "SIMULATOR"
          }
        )
      }
      SmsPhonePool = {
        Type = "AWS::SMSVOICE::Pool"
        Properties = {
          # Reference the phone number ARN created within this stack
          OriginationIdentities = [
            {
              "Fn::Sub" : "arn:aws:sms-voice:$${AWS::Region}:$${AWS::AccountId}:phone-number/$${SmsPhoneNumber}"
            }
          ]
          MandatoryKeywords = local.mandatory_keywords
        }
      }
    }
    Outputs = {
      PhonePoolId = {
        Value = { "Ref" : "SmsPhonePool" }
      }
      PhonePoolArn = {
        Value = {
          "Fn::Sub" : "arn:aws:sms-voice:$${AWS::Region}:$${AWS::AccountId}:pool/$${SmsPhonePool}"
        }
      }
      PhoneNumberId = {
        Value = { "Ref" : "SmsPhoneNumber" }
      }
      PhoneNumberArn = {
        Value = {
          "Fn::Sub" : "arn:aws:sms-voice:$${AWS::Region}:$${AWS::AccountId}:phone-number/$${SmsPhoneNumber}"
        }
      }
    }
  })
}

# Data source to read CloudFormation stack outputs
data "aws_cloudformation_stack" "sms_phone_pool_outputs" {
  name = aws_cloudformation_stack.sms_phone_pool.name

  depends_on = [aws_cloudformation_stack.sms_phone_pool]
}