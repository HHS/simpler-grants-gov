resource "aws_iam_policy" "bedrock_access" {
  name   = "${var.name}-access"
  policy = data.aws_iam_policy_document.bedrock_access.json
}

data "aws_iam_policy_document" "bedrock_access" {
  statement {
    actions = [
      "bedrock:InvokeDataAutomationAsync",
      "bedrock:GetDataAutomationProject",
      "bedrock:GetBlueprint",
      "bedrock:StartDataAutomationJob",
      "bedrock:GetDataAutomationJob",
      "bedrock:ListDataAutomationJobs"
    ]
    effect = "Allow"
    resources = [
      awscc_bedrock_data_automation_project.bda_project.project_arn,
      "${awscc_bedrock_data_automation_project.bda_project.project_arn}/*",
      "arn:aws:bedrock:*:*:blueprint/*",
      "arn:aws:bedrock:*:*:data-automation-profile/*"
    ]
  }
}
