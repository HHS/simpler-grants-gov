module "secrets" {
  source = "../../modules/secrets"

  service_name = local.service_name
  secrets = {
    for name, config in local.service_config.secrets :
    name => {
      manage_method = config.manage_method

      # When generating secrets and storing them in parameter store, append the
      # terraform workspace to the secret store path if the environment is temporary
      # to avoid conflicts with existing environments.
      # Don't do this for secrets that are managed manually since the temporary
      # environments will need to share those secrets.
      secret_store_name = (config.manage_method == "generated" && local.is_temporary ?
        "${config.secret_store_name}/${terraform.workspace}" :
        config.secret_store_name
      )
    }
  }
}
