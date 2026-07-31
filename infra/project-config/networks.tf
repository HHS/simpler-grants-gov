locals {
  network_configs = {
    dev = {
      account_name                 = "simpler-grants-gov"
      database_subnet_group_name   = "dev"
      vpc_name                     = "dev"
      second_octet                 = 0               # The second octet our the VPC CIDR block
      grants_gov_oracle_cidr_block = "10.220.0.0/16" # MicroHealth managed CIDR block where the dev origin Oracle database for Grants.gov is located
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
      account_name                 = "simpler-grants-gov"
      database_subnet_group_name   = "staging"
      vpc_name                     = "staging"
      second_octet                 = 1               # The second octet our the VPC CIDR block
      grants_gov_oracle_cidr_block = "10.220.0.0/16" # MicroHealth managed CIDR block where the dev origin Oracle database for Grants.gov is located

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
    grantee1 = {
      account_name                 = "simpler-grants-gov"
      database_subnet_group_name   = "grantee1"
      vpc_name                     = "grantee1"
      second_octet                 = 30              # The second octet our the VPC CIDR block
      grants_gov_oracle_cidr_block = "10.207.0.0/16" # MicroHealth managed CIDR block where the test1 origin Oracle database for Grants.gov is located
      domain_config = {
        manage_dns  = false
        hosted_zone = null # DNS is managed externally; set once Route53 hosted zone is created

        certificate_configs = {}
      }
    }
    grantee2 = {
      account_name                 = "simpler-grants-gov"
      database_subnet_group_name   = "grantee2"
      vpc_name                     = "grantee2"
      second_octet                 = 31              # The second octet our the VPC CIDR block
      grants_gov_oracle_cidr_block = "10.207.0.0/16" # MicroHealth managed CIDR block where the test1 origin Oracle database for Grants.gov is located
      domain_config = {
        manage_dns  = false
        hosted_zone = null # DNS is managed externally; set once Route53 hosted zone is created

        certificate_configs = {}
      }
    }
    grantor1 = {
      account_name                 = "simpler-grants-gov"
      database_subnet_group_name   = "grantor1"
      vpc_name                     = "grantor1"
      second_octet                 = 32              # The second octet our the VPC CIDR block
      grants_gov_oracle_cidr_block = "10.207.0.0/16" # MicroHealth managed CIDR block where the test1 origin Oracle database for Grants.gov is located
      enable_dms                   = false           # grantor1 does not peer with the Grants.gov Oracle DMS network
      domain_config = {
        manage_dns  = false
        hosted_zone = null # DNS is managed externally; set once Route53 hosted zone is created

        certificate_configs = {}
      }
    }
    prod = {
      account_name                 = "simpler-grants-gov"
      database_subnet_group_name   = "prod"
      vpc_name                     = "prod"
      second_octet                 = 3               # The second octet our the VPC CIDR block
      grants_gov_oracle_cidr_block = "10.250.0.0/16" # MicroHealth managed CIDR block where the prod origin Oracle database for Grants.gov is located
      domain_config = {
        manage_dns  = false
        hosted_zone = "simpler.grants.gov"

        certificate_configs = {}
      }
    }
    # ---------------------------------------------------------------------------
    # infra-dev environment (AWS account 061664787759, the "dev" account)
    #
    # infra-dev is a dev-like environment made up of TWO VPCs: the primary
    # "infra-dev-simpler-grants" VPC and the "infra-dev-grants-management" VPC
    # below. Existing environments are unchanged and still have a single VPC each.
    # The api and frontend services run in the "infra-dev-simpler-grants" VPC
    # (same service set as the existing dev environment). The
    # "infra-dev-grants-management" VPC holds a separate stub ECS service (see
    # infra/sgm/service).
    #
    # NOTE: these keys are the VPC/network names; the *environment* is still
    # "infra-dev" (that's the app-config environment + service/database state key).
    # ---------------------------------------------------------------------------
    infra-dev-simpler-grants = {
      account_name                 = "dev" # AWS account 061664787759 (see infra/accounts/dev.061664787759.s3.tfbackend)
      database_subnet_group_name   = "infra-dev-simpler-grants"
      vpc_name                     = "infra-dev-simpler-grants"
      second_octet                 = 4               # The second octet of the VPC CIDR block (10.4.0.0/20)
      grants_gov_oracle_cidr_block = "10.220.0.0/16" # MicroHealth managed CIDR block where the dev origin Oracle database for Grants.gov is located

      domain_config = {
        manage_dns  = false
        hosted_zone = null # DNS is managed externally; set once a Route53 hosted zone is created

        certificate_configs = {}
      }
    }
    # Second VPC for the infra-dev environment. Holds only the stub ECS service
    # (infra/sgm/service); the api/frontend run in the "infra-dev-simpler-grants"
    # VPC above. No app-config environment maps to this network, so it comes up as
    # a bare VPC (no NAT gateways / DB), which is why the stub runs in the public
    # subnets.
    infra-dev-grants-management = {
      account_name                 = "dev" # AWS account 061664787759 (see infra/accounts/dev.061664787759.s3.tfbackend)
      database_subnet_group_name   = "infra-dev-grants-management"
      vpc_name                     = "infra-dev-grants-management"
      second_octet                 = 5               # The second octet of the VPC CIDR block (10.5.0.0/20)
      grants_gov_oracle_cidr_block = "10.220.0.0/16" # Unused while enable_dms = false, but still read by the api/database layer
      enable_dms                   = false           # does not peer with the Grants.gov Oracle DMS network
      domain_config = {
        manage_dns  = false
        hosted_zone = null # DNS is managed externally; set once a Route53 hosted zone is created

        certificate_configs = {}
      }
    }
    # ---------------------------------------------------------------------------
    # infra-staging environment (AWS account 317380566348, the "staging" account)
    #
    # ---------------------------------------------------------------------------
    infra-staging = {
      account_name                 = "staging" # AWS account 317380566348 (see infra/accounts/staging.317380566348.s3.tfbackend)
      database_subnet_group_name   = "infra-staging"
      vpc_name                     = "infra-staging"
      second_octet                 = 6               # The second octet of the VPC CIDR block (10.6.0.0/20)
      grants_gov_oracle_cidr_block = "10.220.0.0/16" # MicroHealth managed CIDR block where the dev origin Oracle database for Grants.gov is located
      enable_dms                   = true            # peers with the Grants.gov Oracle DMS network, mirroring staging

      domain_config = {
        manage_dns  = false
        hosted_zone = null # DNS is managed externally; set once a Route53 hosted zone is created

        certificate_configs = {}
      }
    }

    infra-training = {
      account_name                 = "training" # AWS account 049145893907 (see infra/accounts/training.049145893907.s3.tfbackend)
      database_subnet_group_name   = "infra-training"
      vpc_name                     = "infra-training"
      second_octet                 = 7               # The second octet of the VPC CIDR block (10.7.0.0/20)
      grants_gov_oracle_cidr_block = "10.207.0.0/16" # MicroHealth managed CIDR block where the training origin Oracle database for Grants.gov is located

      enable_dms = true

      domain_config = {
        manage_dns  = false
        hosted_zone = null # DNS is managed externally; set once a Route53 hosted zone is created

        certificate_configs = {}
      }
    }
    infra-grantee1 = {
      account_name                 = "simpler-grants-gov" # AWS account 315341936575 (reuses the main account with its own VPC)
      database_subnet_group_name   = "infra-grantee1"
      vpc_name                     = "infra-grantee1"
      second_octet                 = 8               # The second octet of the VPC CIDR block (10.8.0.0/20)
      grants_gov_oracle_cidr_block = "10.207.0.0/16" # MicroHealth managed CIDR block (unused; DMS peering is disabled for this env)

      enable_dms = false

      domain_config = {
        manage_dns  = false
        hosted_zone = null # DNS is managed externally; set once a Route53 hosted zone is created

        certificate_configs = {}
      }
    }
  }
}
