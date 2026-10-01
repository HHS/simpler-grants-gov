
resource "aws_iam_role" "processor_service" {
  count = var.enable_processor_service ? 1 : 0

  name               = "${var.service_name}-processor"
  assume_role_policy = data.aws_iam_policy_document.ecs_tasks_assume_role_policy.json
}

resource "aws_iam_role_policy_attachment" "processor_service_runtime_logs" {
  count = var.enable_processor_service ? 1 : 0

  role       = aws_iam_role.processor_service[0].name
  policy_arn = aws_iam_policy.runtime_logs.arn
}

resource "aws_iam_role_policy_attachment" "processor_service_db_access" {
  count = var.enable_processor_service && var.db_vars != null ? 1 : 0

  role       = aws_iam_role.processor_service[0].name
  policy_arn = var.db_vars.app_access_policy_arn
}

resource "aws_iam_role_policy_attachment" "processor_service_email_access" {
  count = var.enable_processor_service && length(var.pinpoint_app_id) > 0 ? 1 : 0

  role       = aws_iam_role.processor_service[0].name
  policy_arn = aws_iam_policy.email_access[0].arn
}
