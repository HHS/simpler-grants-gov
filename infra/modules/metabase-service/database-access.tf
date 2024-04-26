#-----------------
# Database Access
#-----------------

resource "aws_vpc_security_group_ingress_rule" "db_ingress_from_service" {
  count = var.db_vars != null ? length(var.db_vars.security_group_ids) : 0

  security_group_id = var.db_vars.security_group_ids[count.index]
  description       = "Allow inbound requests to database from ${var.service_name} service"

  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"
  referenced_security_group_id = aws_security_group.app.id
}
