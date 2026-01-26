locals {
  domain_name = var.domain_name
}

data "aws_acm_certificate" "certificate" {
  count  = var.enable_https ? 1 : 0
  domain = var.domain_name
}

data "aws_route53_zone" "zone" {
  count = var.hosted_zone != null ? 1 : 0
  name  = var.hosted_zone
}
