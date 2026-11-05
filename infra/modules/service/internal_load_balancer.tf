
# API Gateway's VPC Link private integration only reaches an internal load balancer

locals {
  enable_internal_alb = var.enable_load_balancer && var.enable_secure_alb

  # ALB names are capped at 32 characters.
  internal_alb_name = substr("${var.service_name}-internal", 0, 32)
}

resource "aws_security_group" "internal_alb" {
  count = local.enable_internal_alb ? 1 : 0

  name_prefix = "${var.service_name}-internal-alb"
  description = "Allow TCP traffic to the internal application load balancer"
  vpc_id      = module.network.vpc_id

  lifecycle {
    create_before_destroy = true
    ignore_changes        = [description]
  }
}

resource "aws_security_group_rule" "internal_alb_ingress_from_api_gateway_vpc_link" {
  count = local.enable_internal_alb && var.enable_api_gateway ? 1 : 0

  security_group_id        = aws_security_group.internal_alb[0].id
  description              = "Allow HTTPS from the API Gateway VPC Link"
  type                     = "ingress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.api_gateway_vpc_link[0].id
}

# The private hosted zone below points alb.<env> at this ALB for everything inside the VPC, so in-VPC callers (ClamAV scanner, ECS tasks) need ingress
data "aws_vpc" "internal_alb" {
  count = local.enable_internal_alb ? 1 : 0
  id    = module.network.vpc_id
}

resource "aws_security_group_rule" "internal_alb_ingress_from_vpc" {
  count = local.enable_internal_alb ? 1 : 0

  security_group_id = aws_security_group.internal_alb[0].id
  description       = "Allow HTTPS from in-VPC callers"
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = [data.aws_vpc.internal_alb[0].cidr_block]
}

resource "aws_security_group_rule" "internal_alb_app_egress" {
  count = local.enable_internal_alb ? 1 : 0

  depends_on = [aws_security_group.app]

  description              = "Allow traffic to the application containers"
  from_port                = 0
  to_port                  = 0
  protocol                 = "-1"
  security_group_id        = aws_security_group.internal_alb[0].id
  source_security_group_id = aws_security_group.app.id
  type                     = "egress"
}

# trivy:ignore:AVD-AWS-0053
resource "aws_lb" "internal" {
  # checkov:skip=CKV2_AWS_76:Matches the public ALB; WAF is not part of this stack
  # checkov:skip=CKV_AWS_150:Allow deletion for automated tests, matching the public ALB
  count = local.enable_internal_alb ? 1 : 0

  name            = local.internal_alb_name
  internal        = true
  idle_timeout    = "120"
  security_groups = [aws_security_group.internal_alb[0].id]
  subnets         = module.network.private_subnet_ids

  drop_invalid_header_fields = true
  enable_deletion_protection = !var.is_temporary

  access_logs {
    bucket  = aws_s3_bucket.access_logs.id
    prefix  = "${local.internal_alb_name}-lb"
    enabled = true
  }

  depends_on = [aws_s3_bucket_policy.access_logs]
}

resource "aws_lb_target_group" "internal_tg" {
  # checkov:skip=CKV_AWS_378:TLS terminates at the ALB, same as the public target group
  count                = local.enable_internal_alb ? 1 : 0
  name_prefix          = "int-"
  port                 = var.container_port
  protocol             = "HTTP"
  vpc_id               = module.network.vpc_id
  target_type          = "ip"
  deregistration_delay = "30"

  health_check {
    path                = var.healthcheck_path
    port                = var.container_port
    healthy_threshold   = 2
    unhealthy_threshold = 10
    interval            = 60
    timeout             = 29
    matcher             = "200-299"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_lb_listener" "internal_https" {
  count = local.enable_internal_alb && var.certificate_arn != null ? 1 : 0

  load_balancer_arn = aws_lb.internal[0].arn
  port              = 443
  protocol          = "HTTPS"
  certificate_arn   = var.certificate_arn
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.internal_tg[0].arn
  }
}

# The VPC Link integration's uri sets the Host header and is validated against the certificate
# presented here, so the alb.<env> certificate has to be attached to this listener too.
resource "aws_lb_listener_certificate" "internal_https_extra_certs" {
  for_each = local.enable_internal_alb && var.certificate_arn != null ? toset(var.optional_extra_alb_certs) : toset([])

  listener_arn    = aws_lb_listener.internal_https[0].arn
  certificate_arn = each.value
}

# Private hosted zone overriding alb.<env> inside the VPC so it resolves to the internal ALB.

locals {
  enable_internal_alb_zone = local.enable_internal_alb && length(var.optional_extra_alb_domains) > 0
}

resource "aws_route53_zone" "internal_alb" {
  # checkov:skip=CKV2_AWS_38:Private zone, not resolvable outside the VPC
  # checkov:skip=CKV2_AWS_39:Query logging is not available for private hosted zones
  count = local.enable_internal_alb_zone ? 1 : 0

  name    = var.optional_extra_alb_domains[0]
  comment = "Private resolution for the internal ${var.service_name} ALB"

  vpc {
    vpc_id = module.network.vpc_id
  }
}

resource "aws_route53_record" "internal_alb" {
  count = local.enable_internal_alb_zone ? 1 : 0

  zone_id = aws_route53_zone.internal_alb[0].zone_id
  name    = var.optional_extra_alb_domains[0]
  type    = "A"

  alias {
    name                   = aws_lb.internal[0].dns_name
    zone_id                = aws_lb.internal[0].zone_id
    evaluate_target_health = true
  }
}
