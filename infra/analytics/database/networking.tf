data "aws_ssm_parameter" "database_security_group_id" {
  name = "/api-${var.environment_name}/security-group-id"
}

resource "aws_vpc_security_group_egress_rule" "analytics_egress_to_db" {
  security_group_id = module.database.database_security_group_id
  description       = "Allow analytics to access database"

  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"
  referenced_security_group_id = data.aws_ssm_parameter.database_security_group_id.value
}

resource "aws_vpc_security_group_ingress_rule" "db_ingress_from_analytics" {
  security_group_id = data.aws_ssm_parameter.database_security_group_id.value
  description       = "Allow inbound requests to database from role manager"

  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"
  referenced_security_group_id = module.database.database_security_group_id
}
