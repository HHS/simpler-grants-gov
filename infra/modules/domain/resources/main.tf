terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      configuration_aliases = [aws, aws.us-east-1]
    }
  }
}

# Create a Route53 hosted zone for the domain.
# Individual address records will be created in the service layer by the services that
# need them (e.g. the load balancer or CDN).
# If DNS is managed elsewhere then this resource will not be created.
resource "aws_route53_zone" "zone" {
  count = var.manage_dns ? 1 : 0
  name  = var.name

  # checkov:skip=CKV2_AWS_38:TODO(https://github.com/navapbc/template-infra/issues/560) enable DNSSEC
}
