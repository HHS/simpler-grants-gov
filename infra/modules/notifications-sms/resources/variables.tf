variable "name" {
  type        = string
  description = "Name to give the SMS notifications resources."
}

variable "phone_pool_arn" {
  type        = string
  description = "The ARN of the phone pool to use for sending SMS messages."
}
