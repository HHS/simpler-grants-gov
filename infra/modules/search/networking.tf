data "aws_vpc" "vpc" {
  id = var.vpc_id
}

resource "aws_security_group" "opensearch" {
  name_prefix = "opensearch-${var.service_name}"
  description = "Security group for OpenSearch domain ${var.service_name}"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    description = "Allow inbound HTTPS traffic from the VPC"

    cidr_blocks = [
      data.aws_vpc.vpc.cidr_block,
    ]
  }

  lifecycle {
    create_before_destroy = true
  }

  # checkov:skip=CKV2_AWS_5: https://github.com/bridgecrewio/checkov/issues/6760
}

resource "aws_opensearch_vpc_endpoint" "opensearch" {
  domain_arn = aws_opensearch_domain.opensearch.arn
  vpc_options {
    subnet_ids         = var.subnet_ids
    security_group_ids = [aws_security_group.opensearch.id]
  }
}
