locals {
  # We have the option to route the CDN to multiple origins based on the origin id.
  # We do not currently do this, though.
  default_origin_id        = "default"
  ssl_protocols            = ["TLSv1.2"]
  minimum_protocol_version = "TLSv1.2_2021"
  enable_cdn               = var.enable_alb_cdn || var.enable_s3_cdn

  # The domain name of the CDN, ie. URL people use in order to access the CDN.
  # Null outputs here result in the CDN content being served from the CDN's default domain name.
  #   - If the origin is an ALB, and the ALB's domain name is not null,
  #     then use the domain name of the ALB
  #   - If the origin is an ALB, and the ALB's domain name is null,
  #     then return null
  #   - If the origin is an S3 bucket, and the S3 bucket's desired domain name is not null,
  #     then use the domain name of the S3 bucket
  #   - If the origin is an S3 bucket, and the S3 bucket's desired domain name is null,
  #     then return null
  cdn_domain_name         = var.enable_alb_cdn && var.domain_name != null ? var.domain_name : var.enable_s3_cdn && var.s3_cdn_domain_name != null ? var.s3_cdn_domain_name : null
  cdn_domain_name_env_var = local.cdn_domain_name != null ? local.cdn_domain_name : length(aws_cloudfront_distribution.cdn) != 0 ? aws_cloudfront_distribution.cdn[0].domain_name : null
  cdn_certificate_arn     = var.enable_s3_cdn ? var.s3_cdn_certificate_arn : var.enable_alb_cdn ? var.certificate_arn : null

  # The domain name of the origin, ie. where the content is being served from.
  #   - If the origin is an ALB, this is the DNS name of the ALB
  #   - If the origin is an S3 bucket, this is the regional domain name of the S3 bucket.
  origin_domain_name = var.enable_alb_cdn ? aws_lb.alb[0].dns_name : var.enable_s3_cdn ? aws_s3_bucket.s3_buckets[var.s3_cdn_bucket_name].bucket_regional_domain_name : null
}

resource "aws_cloudfront_origin_access_control" "cdn" {
  count = local.enable_cdn ? 1 : 0

  name                              = var.service_name
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_cache_policy" "default" {
  count = local.enable_cdn ? 1 : 0

  name = var.service_name

  # Default to caching for 1 hour.
  min_ttl = 3600

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "whitelist"
      cookies {
        items = ["session"]
      }
    }
    headers_config {
      # The only options are "none" and "whitelist", there is no "all" option
      header_behavior = "none"
    }
    query_strings_config {
      query_string_behavior = "all"
    }
  }
}

resource "aws_cloudfront_distribution" "cdn" {
  count = local.enable_cdn ? 1 : 0

  enabled = local.enable_cdn ? true : false
  aliases = local.cdn_domain_name == null ? null : [local.cdn_domain_name]

  dynamic "origin" {
    for_each = var.enable_alb_cdn ? [1] : []

    content {
      domain_name = local.origin_domain_name
      origin_id   = local.default_origin_id
      custom_origin_config {
        http_port              = 80
        https_port             = 443
        origin_protocol_policy = "http-only"
        origin_ssl_protocols   = local.ssl_protocols
      }

      dynamic "origin_shield" {
        for_each = local.cdn_certificate_arn == null ? [1] : []
        content {
          enabled              = true
          origin_shield_region = data.aws_region.current.name
        }
      }
    }
  }

  dynamic "origin" {
    for_each = var.enable_s3_cdn ? [1] : []
    content {
      domain_name              = local.origin_domain_name
      origin_id                = local.default_origin_id
      origin_access_control_id = aws_cloudfront_origin_access_control.cdn[0].id

      dynamic "origin_shield" {
        for_each = local.cdn_certificate_arn == null ? [1] : []
        content {
          enabled              = true
          origin_shield_region = data.aws_region.current.name
        }
      }
    }
  }

  logging_config {
    include_cookies = false
    bucket          = aws_s3_bucket.cdn[0].bucket_domain_name
  }

  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    target_origin_id       = local.default_origin_id
    cache_policy_id        = aws_cloudfront_cache_policy.default[0].id
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  dynamic "viewer_certificate" {
    for_each = local.cdn_certificate_arn != null ? [1] : []
    content {
      acm_certificate_arn            = local.cdn_certificate_arn
      cloudfront_default_certificate = false
      minimum_protocol_version       = local.minimum_protocol_version
      ssl_support_method             = "sni-only"
    }
  }

  dynamic "viewer_certificate" {
    for_each = local.cdn_certificate_arn == null ? [1] : []
    content {
      cloudfront_default_certificate = true
      minimum_protocol_version       = local.minimum_protocol_version
    }
  }

  depends_on = [
    aws_s3_bucket_public_access_block.cdn[0],
    aws_s3_bucket_acl.cdn[0],
    aws_s3_bucket.cdn[0],
  ]

  #checkov:skip=CKV2_AWS_42: Sometimes we don't have a skip
  #checkov:skip=CKV2_AWS_46: We sometimes use a ALB origin
  #checkov:skip=CKV_AWS_174: False positive
  #checkov:skip=CKV_AWS_310: Configure a failover in future work
  #checkov:skip=CKV_AWS_68: Configure WAF in future work
  #checkov:skip=CKV2_AWS_47: Configure WAF in future work
  #checkov:skip=CKV2_AWS_32: Configure response headers policy in future work
  #checkov:skip=CKV_AWS_374: Ignore the geo restriction
  #checkov:skip=CKV_AWS_305: We don't need a default root object... we don't need to redirect / to index.html.
  #checkov:skip=CKV_AWS_34: Rely on browser-land redirects
}
