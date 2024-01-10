#-----------------
# Database Access 
#-----------------

resource "aws_vpc_security_group_ingress_rule" "db_ingress_from_service" {
  count = var.db_vars != null ? length(var.db_vars.security_group_ids) : 0

  security_group_id = var.db_vars.security_group_ids[count.index]
  description       = "Allow inbound requests to database from ${var.service_name} service"

  from_port                    = tonumber(var.db_vars.connection_info.port)
  to_port                      = tonumber(var.db_vars.connection_info.port)
  ip_protocol                  = "tcp"
  referenced_security_group_id = aws_security_group.app.id
}

resource "aws_iam_role_policy_attachment" "app_service_db_access" {
  count = var.db_vars != null ? 1 : 0

  role       = aws_iam_role.app_service.name
  policy_arn = var.db_vars.app_access_policy_arn
}

resource "aws_iam_role_policy_attachment" "migrator_db_access" {
  count = var.db_vars != null ? 1 : 0

  role       = aws_iam_role.migrator_task[0].name
  policy_arn = var.db_vars.migrator_access_policy_arn
}
