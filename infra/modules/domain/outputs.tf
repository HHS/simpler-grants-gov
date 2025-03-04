output "hosted_zone_name_servers" {
  value = length(aws_route53_zone.zone) > 0 ? aws_route53_zone.zone[0].name_servers : []
}

output "certificate_arns" {
  value = {
    for domain in keys(var.certificate_configs) : domain => aws_acm_certificate.issued[domain].arn
  }
}
