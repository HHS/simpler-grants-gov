locals {
  network_configs = {
    dev = {
      database_subnet_group_name = "dev"

      domain_config = {
        manage_dns = true
        # Placeholder value for the hosted zone
        # A hosted zone represents a domain and all of its subdomains. For example, a
        # hosted zone of foo.domain.com includes foo.domain.com, bar.foo.domain.com, etc.
        hosted_zone = "hosted.zone.for.dev.network.com"

        certificate_configs = {
          # Example certificate configuration for a certificate that is managed by the project
          # "sub.domain.com" = {
          #   source = "issued"
          # }

          # Example certificate configuration for a certificate that is issued elsewhere and imported into the project
          # (currently not supported, will be supported via https://github.com/navapbc/template-infra/issues/559)
          # "platform-test-dev.navateam.com" = {
          #   source = "imported"
          #   private_key_ssm_name = "/certificates/sub.domain.com/private-key"
          #   certificate_body_ssm_name = "/certificates/sub.domain.com/certificate-body"
          # }
        }
      }
    }

    staging = {
      database_subnet_group_name = "staging"

      domain_config = {
        manage_dns  = true
        hosted_zone = "hosted.zone.for.staging.network.com"

        certificate_configs = {}
      }
    }

    prod = {
      database_subnet_group_name = "prod"

      domain_config = {
        manage_dns  = true
        hosted_zone = "hosted.zone.for.prod.network.com"

        certificate_configs = {}
      }
    }
  }
}
