locals {
  # Filter configs for issued certificates.
  # These certificates are managed by the project using AWS Certificate Manager.
  issued_certificate_configs = {
    for domain, config in var.certificate_configs : domain => config
    if config.source == "issued"
  }

  # Filter configs for imported certificates.
  # These certificates are created outside of the project and imported.
  imported_certificate_configs = {
    for domain, config in var.certificate_configs : domain => config
    if config.source == "imported"
  }

  domain_validation_options = merge([
    for domain, config in local.issued_certificate_configs :
    {
      for dvo in aws_acm_certificate.issued[domain].domain_validation_options :
      dvo.domain_name => {
        name   = dvo.resource_record_name
        record = dvo.resource_record_value
        type   = dvo.resource_record_type
      }
    }
  ]...)
}

# ACM certificate that will be used by the load balancer.
resource "aws_acm_certificate" "issued" {
  for_each = local.issued_certificate_configs

  domain_name       = each.key
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# DNS records for certificate validation.
resource "aws_route53_record" "validation" {
  for_each = local.domain_validation_options

  allow_overwrite = true
  zone_id         = aws_route53_zone.zone[0].zone_id
  name            = each.value.name
  type            = each.value.type
  ttl             = 60
  records         = [each.value.record]
}

# Representation of successful validation of the ACM certificate.
resource "aws_acm_certificate_validation" "validation" {
  for_each = local.imported_certificate_configs

  certificate_arn         = aws_acm_certificate.issued[each.key].arn
  validation_record_fqdns = [for record in aws_route53_record.validation : record.fqdn]
}
