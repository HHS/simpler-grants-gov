locals {
  service_config = {
    service_name                  = "${var.app_name}-${var.environment}"
    region                        = var.default_region
    cpu                           = var.service_cpu
    memory                        = var.service_memory
    desired_instance_count        = var.service_desired_instance_count
    enable_command_execution      = var.enable_command_execution
    enable_https                  = var.enable_https
    domain_name                   = var.domain_name
    instance_scaling_max_capacity = var.instance_scaling_max_capacity
    instance_scaling_min_capacity = var.instance_scaling_min_capacity

    extra_environment_variables = merge(
      local.default_extra_environment_variables,
      var.service_override_extra_environment_variables
    )

    secrets = local.secrets
  }
}
