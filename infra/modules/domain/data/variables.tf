variable "hosted_zone" {
  type        = string
  description = "Fully qualified domain name for the Route 53 hosted zone"
}

variable "domain_name" {
  type        = string
  description = "Fully qualified domain name"
}

variable "enable_https" {
  type        = bool
  description = "Whether to enable HTTPS for the domain"
}
