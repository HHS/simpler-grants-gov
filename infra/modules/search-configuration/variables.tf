variable "role_mappings" {
  description = "The roles to map to the OpenSearch domain"
  type = list(object({
    name        = string
    description = string
    roles       = list(string)
  }))
}
