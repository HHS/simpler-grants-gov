locals {
  # We have the option to route the CDN to multiple origins based on the origin id.
  # We do not currently do this, though.
  default_origin_id = "default"
}

resource "aws_cloudfront_origin_access_identity" "cdn" {
  count = var.enable_cdn ? 1 : 0

  comment = "Origin Access Identity for CloudFront to access S3 bucket"
}

resource "aws_cloudfront_cache_policy" "default" {
  count = var.enable_cdn ? 1 : 0

  name = "default"

  # Default to caching for 1 hour, with a minimum of 1 minute.
  # The default TTL can be overriden by the `Cache-Control max-age` or `Expires` headers
  # There's also a `max_ttl` option, which can be used to override the above headers.
  min_ttl     = 60
  default_ttl = 3600

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "all"
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
  count           = var.enable_cdn ? 1 : 0
  enabled         = true
  is_ipv6_enabled = true
  aliases         = var.domain != null ? [var.domain] : []

  origin {
    domain_name = aws_lb.alb[0].dns_name
    origin_id   = local.default_origin_id
    custom_origin_config {
      http_port              = 80
      https_port             = var.cert_arn == null ? 80 : 443
      origin_protocol_policy = "match-viewer"

      # See possible values here:
      # https://docs.aws.amazon.com/cloudfront/latest/APIReference/API_OriginSslProtocols.html
      origin_ssl_protocols = ["TLSv1.2"]
    }
    origin_shield {
      enabled              = true
      origin_shield_region = data.aws_region.current.name
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
    viewer_protocol_policy = var.cert_arn == null ? "allow-all" : "redirect-to-https"

    # Default to caching for 1 hour, with a minimum of 1 minute.
    # The default TTL can be overriden by the `Cache-Control max-age` or `Expires` headers
    # There's also a `max_ttl` option, which can be used to override the above headers.
    min_ttl     = 60
    default_ttl = 3600
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn            = var.cert_arn == null ? null : var.cert_arn
    cloudfront_default_certificate = var.cert_arn == null ? true : false
  }

  depends_on = [
    aws_s3_bucket_public_access_block.cdn[0],
    aws_s3_bucket_policy.cdn[0],
    aws_s3_bucket.cdn[0],
  ]

  #checkov:skip=CKV2_AWS_46:We aren't using a S3 origin
}
