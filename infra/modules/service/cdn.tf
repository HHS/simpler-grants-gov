locals {
  # We have the option to route the CDN to multiple origins based on the origin id.
  # We do not currently do this, though.
  default_origin_id = "default"
}

resource "aws_s3_bucket" "cdn" {
  count = var.enable_cdn ? 1 : 0

  bucket_prefix = "${var.service_name}-cdn-access-logs"
  force_destroy = false
  # checkov:skip=CKV2_AWS_62:Event notification not necessary for this bucket especially due to likely use of lifecycle rules
  # checkov:skip=CKV_AWS_18:Access logging was not considered necessary for this bucket
  # checkov:skip=CKV_AWS_144:Not considered critical to the point of cross region replication
  # checkov:skip=CKV_AWS_300:Known issue where Checkov gets confused by multiple rules
  # checkov:skip=CKV_AWS_21:Bucket versioning is not worth it in this use case
}

resource "aws_cloudfront_cache_policy" "default" {
  name = "default"

  # These are the default values
  min_ttl     = 0
  default_ttl = 3600
  max_ttl     = 86400

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "all"
    }
    headers_config {
      header_behavior = "all"
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
    domain_name = "http://${aws_lb.alb[0].dns_name}"
    origin_id   = local.default_origin_id
  }

  logging_config {
    include_cookies = false
    bucket          = aws_s3_bucket.cdn[0].bucket_domain_name
  }

  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    target_origin_id       = local.default_origin_id
    cache_policy_id        = aws_cloudfront_cache_policy.default.id
    compress               = true
    viewer_protocol_policy = "allow-all"

    # Default to caching for 1 hour, with a minimum of 1 minute.
    # The default TTL can be overriden by the `Cache-Control max-age` or `Expires` headers
    # There's also a `max_ttl` option, which can be used to override the above headers.
    min_ttl     = 60
    default_ttl = 3600

    forwarded_values {
      query_string = true

      cookies {
        forward = "all"
      }
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn = var.cert_arn
  }
}
