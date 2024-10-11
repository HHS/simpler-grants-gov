terraform {
  required_providers {
    opensearch = {
      source = "opensearch-project/opensearch"
    }
  }
}

resource "opensearch_roles_mapping" "mapper" {
  for_each = { for mapping in var.role_mappings : mapping.name => mapping }

  role_name     = each.value.name
  description   = each.value.description
  backend_roles = each.value.roles
}
