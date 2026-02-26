variable "feature_flags" {
  type        = map(string)
  description = "A map of feature flags"
}

variable "service_name" {
  type        = string
  description = "The name of the service that the feature flagging system will be associated with"
}
