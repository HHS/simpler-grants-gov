terraform {
  required_providers {
    opensearch = {
      source = "opensearch-project/opensearch"
    }
  }
}

resource "opensearch_roles_mapping" "mapper" {
  for_each = { for mapping in var.role_mappings : mapping.name => mapping }

  role_name     = each.name
  description   = each.description
  backend_roles = each.roles
}
