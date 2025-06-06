module "secrets" {
  for_each = local.service_config.secrets

  source = "../../modules/secret"

  # When generating secrets and storing them in parameter store, append the
  # terraform workspace to the secret store path if the environment is temporary
  # to avoid conflicts with existing environments.
  # Don't do this for secrets that are managed manually since the temporary
  # environments will need to share those secrets.
  secret_store_name = (each.value.manage_method == "generated" && local.is_temporary ?
    "${each.value.secret_store_name}/${terraform.workspace}" :
    each.value.secret_store_name
  )
  manage_method = each.value.manage_method
}
