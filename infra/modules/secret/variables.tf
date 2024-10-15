variable "manage_method" {
  type        = string
  description = <<EOT
    Method to manage the secret. Options are 'manual' or 'generated'.
    Set to 'generated' to generate a random secret.
    Set to 'manual' to reference a secret that was manually created and stored in AWS parameter store.
    Defaults to 'generated'."
  EOT
  default     = "generated"
  validation {
    condition     = can(regex("^(manual|generated)$", var.manage_method))
    error_message = "Invalid manage_method. Must be 'manual' or 'generated'."
  }
}

variable "secret_store_name" {
  type        = string
  description = <<EOT
    If manage_method is 'generated', path to store the secret in AWS parameter store.
    If manage_method is 'manual', path to reference the secret in AWS parameter store.
  EOT
}
