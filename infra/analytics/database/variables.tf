variable "environment_name" {
  type        = string
  description = "name of the application environment"
}

variable "database_snapshot_id" {
  type        = string
  description = "Snapshot ARN or ID to restore the cluster from. Pass via -var at apply time alongside -replace=module.database.aws_rds_cluster.db."
  default     = null
}
