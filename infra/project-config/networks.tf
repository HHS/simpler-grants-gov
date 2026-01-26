locals {
  network_configs = {
    dev = {
<<<<<<< before updating
<<<<<<< before updating
<<<<<<< before updating
      account_name                 = "simpler-grants-gov"
      database_subnet_group_name   = "dev"
      vpc_name                     = "dev"
      second_octet                 = 0               # The second octet our the VPC CIDR block
      grants_gov_oracle_cidr_block = "10.220.0.0/16" # MicroHealth managed CIDR block where the dev origin Oracle database for Grants.gov is located
=======
=======
>>>>>>> after updating
=======
>>>>>>> after updating
      account_name = "dev"

>>>>>>> after updating
      domain_config = {
        manage_dns = false
        # Placeholder value for the hosted zone
        # A hosted zone represents a domain and all of its subdomains. For example, a
        # hosted zone of foo.domain.com includes foo.domain.com, bar.foo.domain.com, etc.
        hosted_zone = "dev.simpler.grants.gov"

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
<<<<<<< before updating
<<<<<<< before updating
<<<<<<< before updating
      account_name                 = "simpler-grants-gov"
      database_subnet_group_name   = "staging"
      vpc_name                     = "staging"
      second_octet                 = 1               # The second octet our the VPC CIDR block
      grants_gov_oracle_cidr_block = "10.220.0.0/16" # MicroHealth managed CIDR block where the dev origin Oracle database for Grants.gov is located
=======
=======
>>>>>>> after updating
=======
>>>>>>> after updating
      account_name = "staging"

>>>>>>> after updating
      domain_config = {
        manage_dns  = false
        hosted_zone = "staging.simpler.grants.gov"

        certificate_configs = {}
      }
    }
    training = {
      account_name                 = "simpler-grants-gov"
      database_subnet_group_name   = "training"
      vpc_name                     = "training"
      second_octet                 = 9               # The second octet our the VPC CIDR block
      grants_gov_oracle_cidr_block = "10.207.0.0/16" # MicroHealth managed CIDR block where the training origin Oracle database for Grants.gov is located
      domain_config = {
        manage_dns  = false
        hosted_zone = "training.simpler.grants.gov"

        certificate_configs = {}
      }
    }
    prod = {
<<<<<<< before updating
<<<<<<< before updating
<<<<<<< before updating
      account_name                 = "simpler-grants-gov"
      database_subnet_group_name   = "prod"
      vpc_name                     = "prod"
      second_octet                 = 3               # The second octet our the VPC CIDR block
      grants_gov_oracle_cidr_block = "10.250.0.0/16" # MicroHealth managed CIDR block where the prod origin Oracle database for Grants.gov is located
=======
=======
>>>>>>> after updating
=======
>>>>>>> after updating
      account_name = "prod"

>>>>>>> after updating
      domain_config = {
        manage_dns  = false
        hosted_zone = "simpler.grants.gov"

        certificate_configs = {}
      }
    }
  }
}
