variable "name" {
  type        = string
  description = "Fully qualified domain name"
}

variable "manage_dns" {
  type        = bool
  description = "Whether DNS is managed by the project (true) or managed externally (false)"
}

variable "certificate_configs" {
  type = map(object({
    source           = string
    private_key      = optional(string)
    certificate_body = optional(string)
  }))
  description = <<EOT
    Map from domains to certificate configuration objects for that domain.

    For each domain's certificate:
    `source` indicates whether the certificate is managed by the project using AWS
    Certificate Manager (issued) or imported from an external source (imported)
    
    `private_key` and `certificate_body` describe the certificate information for
    imported certificates, which is required if `source` is 'imported'.
    EOT

  validation {
    condition = alltrue([
      for certificate_config in var.certificate_configs :
      contains(["issued", "imported"], certificate_config.source)
    ])
    error_message = "certificate_config.source must be either 'issued' or 'imported'"
  }

  validation {
    condition = alltrue([
      for certificate_config in var.certificate_configs :
      certificate_config.source != "imported" || certificate_config.private_key != null
    ])
    error_message = "certificate_config.private_key is required if certificate_config.source is 'imported'"
  }

  validation {
    condition = alltrue([
      for certificate_config in var.certificate_configs :
      certificate_config.source != "imported" || certificate_config.certificate_body != null
    ])
    error_message = "certificate_config.certificate_body is required if certificate_config.source is 'imported'"
  }
}
