variable "app_environment_account_ids" {
  type        = list(string)
  description = "List of AWS account ids for the application's environments. This is used to allow environments pull images from the container image repository."
}

variable "region" {
  type = string
}
