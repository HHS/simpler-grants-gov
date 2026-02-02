#---------------
# Load balancer
#---------------

# ALB for an app running in ECS
resource "aws_lb" "alb" {
  # checkov:skip=CKV2_AWS_76:No Java in our stack, with the intro of the mTLS and the SOAP it supports we likely won't put this behind a WAF ever

  # we need an identical alb, with mtls enabled
  # so we piggy back off existing and just spin up two when the api sets this true
  count           = var.enable_load_balancer ? var.enable_mtls_load_balancer ? 2 : 1 : 0
  depends_on      = [aws_s3_bucket_policy.access_logs]
  ip_address_type = "dualstack"
  # adjust name for the mtls alb that's in slot 1
  name            = count.index == 0 ? var.service_name : format("%s-mtls", var.service_name)
  idle_timeout    = "120"
  internal        = false
  security_groups = [aws_security_group.alb.id]
  subnets         = var.public_subnet_ids

  # Use a separate line to support automated terraform destroy commands
  # checkov:skip=CKV_AWS_150:Allow deletion for automated tests
  enable_deletion_protection = !var.is_temporary

  # TODO(https://github.com/navapbc/template-infra/issues/163) Implement HTTPS
  # checkov:skip=CKV2_AWS_20:Redirect HTTP to HTTPS as part of implementing HTTPS support

  # TODO(https://github.com/navapbc/template-infra/issues/165) Protect ALB with WAF
  # checkov:skip=CKV2_AWS_28:Implement WAF in issue #165

  # Drop invalid HTTP headers for improved security
  # Note that header names cannot contain underscores
  # https://docs.bridgecrew.io/docs/ensure-that-alb-drops-http-headers
  drop_invalid_header_fields = true

  access_logs {
    bucket  = aws_s3_bucket.access_logs.id
    prefix  = "${var.service_name}-lb"
    enabled = true
  }
}

# NOTE: for the demo we expose private http endpoint
# due to the complexity of acquiring a valid TLS/SSL cert.
# In a production system we would provision an https listener
resource "aws_lb_listener" "alb_listener_http" {
  # TODO(https://github.com/navapbc/template-infra/issues/163) Use HTTPS protocol
  # checkov:skip=CKV_AWS_2:Implement HTTPS in issue #163
  # checkov:skip=CKV_AWS_103:Require TLS 1.2 as part of implementing HTTPS support

  # there is no mtls for http so we don't need to do the same dance here
  count = var.enable_load_balancer ? 1 : 0

  load_balancer_arn = aws_lb.alb[0].arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "fixed-response"

    fixed_response {
      content_type = "text/plain"
      message_body = "Not Found"
      status_code  = "404"
    }
  }
}

resource "aws_lb_listener_rule" "app_http_forward" {
  # there is no mtls for http so we don't need to do the same dance here
  count = var.enable_load_balancer ? 1 : 0

  listener_arn = aws_lb_listener.alb_listener_http[0].arn
  priority     = 111

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app_tg[0].arn
  }
  condition {
    path_pattern {
      values = ["/*"]
    }
  }
}

resource "aws_lb_listener" "alb_listener_https" {
  count = var.enable_load_balancer ? var.enable_mtls_load_balancer ? 2 : 1 : 0

  load_balancer_arn = aws_lb.alb[count.index].arn
  port              = 443
  protocol          = "HTTPS"
  certificate_arn   = count.index == 0 ? var.certificate_arn : var.mtls_certificate_arn
  mutual_authentication {
    mode = count.index == 1 ? "passthrough" : "off"
  }

  # Use security policy that supports TLS 1.3 but requires at least TLS 1.2
  ssl_policy = "ELBSecurityPolicy-TLS13-1-2-2021-06"

  default_action {
    type = "fixed-response"

    fixed_response {
      content_type = "text/plain"
      message_body = "Not Found"
      status_code  = "404"
    }
  }
}

# Optional resource, used for if the ALB has multiple certificates
resource "aws_lb_listener_certificate" "alb_listener_https_optional_extra_certs" {
  for_each = toset(var.enable_load_balancer ? var.optional_extra_alb_certs : [])

  listener_arn    = aws_lb_listener.alb_listener_https[0].arn
  certificate_arn = each.value
}

resource "aws_lb_listener_rule" "app_https_forward" {
  # we need an identical https forward, with mtls enabled
  # so we piggy back off existing and just spin up two when the api sets this true
  count = var.enable_load_balancer ? var.enable_mtls_load_balancer ? 2 : 1 : 0

  listener_arn = aws_lb_listener.alb_listener_https[count.index].arn
  priority     = 91

  action {
    type             = "forward"
    target_group_arn = count.index == 0 ? aws_lb_target_group.app_tg[0].arn : aws_lb_target_group.mtls_tg[0].arn
  }
  condition {
    path_pattern {
      values = ["/*"]
    }
  }
}

# these get referenced from the service/main file so we want two distinct ones for easier referencing by app_tg vs mtls_tg names
resource "aws_lb_target_group" "app_tg" {
  # you must use a prefix, to facilitate successful tg changes
  # checkov:skip=CKV_AWS_378:We are using HTTPS, just not here specifically.
  count                = var.enable_load_balancer ? 1 : 0
  name_prefix          = "app-"
  port                 = var.container_port
  protocol             = "HTTP"
  vpc_id               = var.vpc_id
  target_type          = "ip"
  deregistration_delay = "30"

  health_check {
    path                = var.healthcheck_path
    port                = var.container_port
    healthy_threshold   = 2
    unhealthy_threshold = 10
    interval            = 30
    timeout             = 29
    matcher             = "200-299"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_lb_target_group" "mtls_tg" {
  # you must use a prefix, to facilitate successful tg changes
  # checkov:skip=CKV_AWS_378:We are using HTTPS, just not here specifically.

  # done a slightly different way from elsewhere in the file to account for naming these from another file being easier this way
  count                = var.enable_mtls_load_balancer ? 1 : 0
  name_prefix          = "mtls-"
  port                 = var.container_port
  protocol             = "HTTP"
  vpc_id               = var.vpc_id
  target_type          = "ip"
  deregistration_delay = "30"

  health_check {
    path                = var.healthcheck_path
    port                = var.container_port
    healthy_threshold   = 2
    unhealthy_threshold = 10
    interval            = 30
    timeout             = 29
    matcher             = "200-299"
  }

  lifecycle {
    create_before_destroy = true
  }
}
