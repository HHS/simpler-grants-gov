#-----------------------
# Network Configuration
#-----------------------

module "network" {
  source       = "../../modules/network/data"
  name         = var.network_name
  project_name = var.project_name
}

resource "aws_security_group" "alb" {
  # Specify name_prefix instead of name because when a change requires creating a new
  # security group, sometimes the change requires the new security group to be created
  # before the old one is destroyed. In this situation, the new one needs a unique name
  name_prefix = "${var.service_name}-alb"
  description = "Allow TCP traffic to application load balancer"

  lifecycle {
    create_before_destroy = true

    # changing the description is a destructive change
    # just ignore it
    ignore_changes = [description]
  }

  vpc_id = module.network.vpc_id

}

resource "aws_security_group" "alb_restricted" {
  count = local.enable_internal_alb ? 1 : 0

  name_prefix = "${var.service_name}-alb-restricted"
  description = "Public ALB with ingress closed; traffic is served by the internal ALB"
  vpc_id      = module.network.vpc_id

  lifecycle {
    create_before_destroy = true
    ignore_changes        = [description]
  }
}

resource "aws_security_group_rule" "alb_restricted_app_egress" {
  count = local.enable_internal_alb ? 1 : 0

  depends_on = [aws_security_group.app]

  description              = "Allow traffic to the application containers"
  from_port                = 0
  to_port                  = 0
  protocol                 = "-1"
  security_group_id        = aws_security_group.alb_restricted[0].id
  source_security_group_id = aws_security_group.app.id
  type                     = "egress"
}

resource "aws_security_group_rule" "http_ingress" {
  # TODO(https://github.com/navapbc/template-infra/issues/163) Disallow incoming traffic to port 80
  # checkov:skip=CKV_AWS_260:Disallow ingress from 0.0.0.0:0 to port 80 when implementing HTTPS support in issue #163

  security_group_id = aws_security_group.alb.id

  description = "Allow HTTP traffic from public internet"
  from_port   = 80
  to_port     = 80
  protocol    = "tcp"
  cidr_blocks = ["0.0.0.0/0"]
  type        = "ingress"
}

resource "aws_security_group_rule" "alb_app_local_health_check" {

  depends_on = [
    aws_security_group.app
  ]

  description              = "Allow HTTP traffic from public internet"
  from_port                = 0
  to_port                  = 0
  protocol                 = "-1"
  security_group_id        = aws_security_group.alb.id
  source_security_group_id = aws_security_group.app.id
  type                     = "egress"
}

resource "aws_security_group_rule" "https_ingress" {
  count             = var.certificate_arn != null ? 1 : 0
  security_group_id = aws_security_group.alb.id

  description = "Allow HTTPS traffic from public internet"
  from_port   = 443
  to_port     = 443
  protocol    = "tcp"
  cidr_blocks = ["0.0.0.0/0"]
  type        = "ingress"
}

resource "aws_security_group_rule" "http_ingress_ipv6" {
  # TODO(https://github.com/navapbc/template-infra/issues/163) Disallow incoming traffic to port 80
  # checkov:skip=CKV_AWS_260:Disallow ingress from 0.0.0.0:0 to port 80 when implementing HTTPS support in issue #163

  security_group_id = aws_security_group.alb.id

  description      = "Allow HTTP traffic from public internet"
  from_port        = 80
  to_port          = 80
  protocol         = "tcp"
  ipv6_cidr_blocks = ["::/0"]
  type             = "ingress"
}

resource "aws_security_group_rule" "https_ingress_ipv6" {
  count             = var.certificate_arn != null ? 1 : 0
  security_group_id = aws_security_group.alb.id

  description      = "Allow HTTPS traffic from public internet"
  from_port        = 443
  to_port          = 443
  protocol         = "tcp"
  ipv6_cidr_blocks = ["::/0"]
  type             = "ingress"
}

resource "aws_security_group" "api_gateway_vpc_link" {
  count = var.enable_api_gateway && var.enable_secure_alb ? 1 : 0

  name_prefix = "${var.service_name}-apigw-link"
  description = "API Gateway VPC Link V2 ENIs"
  vpc_id      = module.network.vpc_id

  lifecycle {
    create_before_destroy = true
    ignore_changes        = [description]
  }
}

resource "aws_security_group_rule" "api_gateway_vpc_link_egress_to_alb" {
  count = var.enable_api_gateway && local.enable_internal_alb ? 1 : 0

  security_group_id        = aws_security_group.api_gateway_vpc_link[0].id
  description              = "Allow HTTPS to the internal application load balancer"
  type                     = "egress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.internal_alb[0].id
}

# Security group to allow access to Fargate tasks
# trivy:ignore:AVD-AWS-0104
resource "aws_security_group" "app" {
  # Specify name_prefix instead of name because when a change requires creating a new
  # security group, sometimes the change requires the new security group to be created
  # before the old one is destroyed. In this situation, the new one needs a unique name
  name_prefix = "${var.service_name}-app"
  description = "Allow inbound TCP access to application container port"
  vpc_id      = module.network.vpc_id
  lifecycle {
    create_before_destroy = true

    # changing the description is a destructive change
    # just ignore it
    ignore_changes = [description]
  }

  ingress {
    description = "Allow HTTP traffic to application container port"
    protocol    = "tcp"
    from_port   = var.container_port
    to_port     = var.container_port
    security_groups = concat(
      [aws_security_group.alb.id],
      local.enable_internal_alb ? [
        aws_security_group.internal_alb[0].id,
        aws_security_group.alb_restricted[0].id,
      ] : [],
    )
  }

  egress {
    description = "All TCP traffic outbound"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "All TCP traffic outbound"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "All TCP traffic outbound"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
