resource "aws_iam_policy" "access_policy" {
  name        = "${local.evidently_project_name}-access"
  path        = "/"
  description = "Allows calls to EvaluateFeature on the Evidently project ${local.evidently_project_name}"

  policy = data.aws_iam_policy_document.access_policy.json
}

#tfsec:ignore:aws-iam-no-policy-wildcards
data "aws_iam_policy_document" "access_policy" {
  statement {
    sid    = "AllowEvaluateFeature"
    effect = "Allow"
    actions = [
      "evidently:EvaluateFeature",
    ]
    resources = [
      "${aws_evidently_project.feature_flags.arn}/feature/*",
    ]
  }
}
