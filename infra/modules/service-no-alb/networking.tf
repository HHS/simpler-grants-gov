#-----------------------
# Network Configuration
#-----------------------

# Security group to allow access to Fargate tasks
resource "aws_security_group" "app" {
  # Specify name_prefix instead of name because when a change requires creating a new
  # security group, sometimes the change requires the new security group to be created
  # before the old one is destroyed. In this situation, the new one needs a unique name
  name_prefix = "${var.service_name}-app"
  description = "Allow all outgoing traffic from application"
  vpc_id      = var.vpc_id
  lifecycle {
    create_before_destroy = true
  }

  egress {
    description = "Allow all outgoing traffic from application"
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }
}
