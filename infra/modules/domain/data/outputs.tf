output "certificate_arn" {
  value = var.enable_https ? data.aws_acm_certificate.certificate[0].arn : null
}

output "domain_name" {
  value = var.domain_name
}

output "hosted_zone_id" {
  value = var.hosted_zone != null ? data.aws_route53_zone.zone[0].zone_id : null
}
