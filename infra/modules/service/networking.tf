#-----------------------
# Network Configuration
#-----------------------

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

  vpc_id = var.vpc_id

  egress {
    description = "Allow all outgoing traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
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

# Security group to allow access to Fargate tasks
resource "aws_security_group" "app" {
  # Specify name_prefix instead of name because when a change requires creating a new
  # security group, sometimes the change requires the new security group to be created
  # before the old one is destroyed. In this situation, the new one needs a unique name
  name_prefix = "${var.service_name}-app"
  description = "Allow inbound TCP access to application container port"
  vpc_id      = var.vpc_id
  lifecycle {
    create_before_destroy = true

    # changing the description is a destructive change
    # just ignore it
    ignore_changes = [description]
  }

  ingress {
    description     = "Allow HTTP traffic to application container port"
    protocol        = "tcp"
    from_port       = var.container_port
    to_port         = var.container_port
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "Allow all outgoing traffic from application"
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }
}
