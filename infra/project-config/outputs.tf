output "aws_services" {
  description = "AWS services that this project uses"
  value       = local.aws_services
}

output "aws_services_security_group_name_prefix" {
  value = local.aws_services_security_group_name_prefix
}

output "code_repository" {
  value       = regex("([-_\\w]+/[-_\\w]+)(\\.git)?$", local.code_repository_url)[0]
  description = "The 'org/repo' string of the repo (e.g. 'navapbc/template-infra'). This is extracted from the repo URL (e.g. 'git@github.com:navapbc/template-infra.git' or 'https://github.com/navapbc/template-infra.git')"
}

output "code_repository_url" {
  value = local.code_repository_url
}

output "default_region" {
  value = local.default_region
}

output "default_tags" {
  value = {
    project             = local.project_name
    owner               = local.owner
    repository          = local.code_repository_url
    terraform           = true
    terraform_workspace = terraform.workspace
    # description is set in each environments local use key project_description if required.
  }
}

output "github_actions_role_name" {
  value = local.github_actions_role_name
}

output "network_configs" {
  value = local.network_configs
}

output "owner" {
  value = local.owner
}

output "project_name" {
  value = local.project_name
}

output "system_notifications_config" {
  value = local.system_notifications_config
}
