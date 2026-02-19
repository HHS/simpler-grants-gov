resource "aws_route53_record" "dkim" {
  count = 3

  allow_overwrite = true
  ttl             = 60
  type            = "CNAME"
  zone_id         = var.hosted_zone_id
  name            = "${aws_sesv2_email_identity.sender_domain.dkim_signing_attributes[0].tokens[count.index]}._domainkey.${var.domain_name}"
  records         = ["${aws_sesv2_email_identity.sender_domain.dkim_signing_attributes[0].tokens[count.index]}.dkim.amazonses.com"]
}

resource "aws_route53_record" "spf_mail_from" {
  allow_overwrite = true
  ttl             = "600"
  type            = "TXT"
  zone_id         = var.hosted_zone_id
  name            = aws_sesv2_email_identity_mail_from_attributes.sender_domain.mail_from_domain
  records         = ["v=spf1 include:amazonses.com ~all"]
}

resource "aws_route53_record" "mx_receive" {
  allow_overwrite = true
  type            = "MX"
  ttl             = "600"
  zone_id         = var.hosted_zone_id
  name            = local.mail_from_domain
  records         = ["10 feedback-smtp.${data.aws_region.current.name}.amazonses.com"]
}

resource "aws_route53_record" "dmarc" {
  allow_overwrite = true
  ttl             = "600"
  type            = "TXT"
  zone_id         = var.hosted_zone_id
  name            = local.dmarc_domain
  records         = ["v=DMARC1; p=none;"]
}
