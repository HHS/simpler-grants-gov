variable "app_name" {
  type = string
}

variable "environment" {
  description = "name of the application environment (e.g. dev, staging, prod)"
  type        = string
}

variable "default_region" {
  description = "default region for the project"
  type        = string
}

variable "has_database" {
  type = bool
}

variable "has_incident_management_service" {
  type = bool
}

variable "domain" {
  description = "Public domain for the website, which is managed by HHS ITS."
  type        = string
  default     = null
}

variable "sendy_api_key" {
  description = "Sendy API key to pass with requests for sendy subscriber endpoints."
  type        = string
  default     = null
}

variable "sendy_api_url" {
  description = "Sendy API base url for requests to manage subscribers."
  type        = string
  default     = null
}

variable "sendy_list_id" {
  description = "Sendy list ID to for requests to manage subscribers to the Simpler Grants distribution list."
  type        = string
  default     = null
}