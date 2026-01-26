data "aws_region" "current" {}

locals {
  image_registry = "${aws_ecr_repository.app.registry_id}.dkr.ecr.${data.aws_region.current.name}.amazonaws.com"
}

resource "aws_ecr_repository" "app" {
  name                 = var.name
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "KMS"
    kms_key         = aws_kms_key.ecr_kms.arn
  }
}

resource "aws_ecr_repository_policy" "image_access" {
  repository = aws_ecr_repository.app.name
  policy     = data.aws_iam_policy_document.image_access.json
}

resource "aws_ecr_lifecycle_policy" "image_retention" {
  repository = aws_ecr_repository.app.name

  policy = <<EOF
{
    "rules": [
        {
            "rulePriority": 1,
            "description": "Maintain a maximum of 200 images",
            "selection": {
                "tagStatus": "any",
                "countType": "imageCountMoreThan",
                "countNumber": 200
            },
            "action": {
                "type": "expire"
            }
        }
    ]
}
EOF
}

data "aws_iam_policy_document" "image_access" {
  statement {
    sid    = "PushAccess"
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = [var.push_access_role_arn]
    }
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:CompleteLayerUpload",
      "ecr:InitiateLayerUpload",
      "ecr:PutImage",
      "ecr:UploadLayerPart"
    ]
  }

  dynamic "statement" {
    # Only add this statement if we need to define cross-account access policies
    for_each = length(var.app_account_ids) > 0 ? [true] : []
    content {
      sid    = "PullAccess"
      effect = "Allow"
      principals {
        type        = "AWS"
        identifiers = [for account_id in var.app_account_ids : "arn:aws:iam::${account_id}:root"]
      }
      actions = [
        "ecr:BatchGetImage",
        "ecr:GetDownloadUrlForLayer",
      ]
    }
  }
}

resource "aws_kms_key" "ecr_kms" {
  enable_key_rotation = true
  description         = "KMS key for ECR repository ${var.name}"
}
