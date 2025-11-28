#===================================
# Amazon Inspector
#===================================

# Enable Amazon Inspector for EC2, ECR, Lambda Code, and Lambda Standard scanning
# This addresses Inspector.1, Inspector.2, Inspector.3, and Inspector.4 findings
resource "aws_inspector2_enabler" "main" {
  account_ids    = [data.aws_caller_identity.current.account_id]
  resource_types = ["EC2", "ECR", "LAMBDA", "LAMBDA_CODE"]
}

# Note: Inspector findings may show as FAILED in multi-account environments
# if the organization's delegated administrator has not enabled Inspector
# for all member accounts. This resource ensures Inspector is enabled for
# this specific account.
