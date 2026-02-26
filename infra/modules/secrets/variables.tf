variable "service_name" {
  type        = string
  description = "Name of the service these secrets belong to"
}

variable "secrets" {
  type = map(object({
    # Method to manage the secret. Options are 'manual' or 'generated'.
    # Set to 'generated' to generate a random secret.
    # Set to 'manual' to reference a secret that was manually created and stored in AWS parameter store.
    # Defaults to 'generated'.
    manage_method = string

    # If manage_method is 'generated', path to store the secret in AWS parameter store.
    # If manage_method is 'manual', path to reference the secret in AWS parameter store.
    secret_store_name = string
  }))
  description = "Map of secret configurations"

  validation {
    condition     = alltrue([for s in values(var.secrets) : can(regex("^(manual|generated)$", s.manage_method))])
    error_message = "Invalid manage_method. Must be 'manual' or 'generated'."
  }
}
