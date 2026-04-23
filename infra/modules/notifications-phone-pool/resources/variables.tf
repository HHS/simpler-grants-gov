variable "name" {
  type        = string
  description = "Name to give the phone pool resources."
}

variable "sms_sender_phone_number_registration_id" {
  type        = string
  description = <<-EOF
    The AWS End User Messaging Service (EUMS) registration ID to use to provision the sender phone number. This value is obtained in AWS
    and the registration must be in APPROVED or COMPLETE status to be linked.
  EOF
  default     = null
}

variable "sms_number_type" {
  type        = string
  description = "The type of phone number to use for sending SMS messages (LONG_CODE, TOLL_FREE, TEN_DLC, SIMULATOR)."
  default     = "SIMULATOR"
}