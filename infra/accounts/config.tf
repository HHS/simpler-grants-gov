# AWS Config recorder for Security Hub compliance (Config.1)
#
# The Config recorder has been manually configured in AWS to meet Security Hub requirements:
# - Service-linked role (AWSServiceRoleForConfig) instead of custom role
# - Global resource recording enabled (includeGlobalResourceTypes: true)
#
# The recorder is kept out of Terraform state because the NewRelic module creates
# a non-compliant version. Terraform plans will show drift (1 to add) - this is expected.
