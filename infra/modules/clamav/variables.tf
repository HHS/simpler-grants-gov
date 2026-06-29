variable "name" {
  description = "Base name for resources created by this module. Derived names: <name>-scanner, <name>-freshclam, <name>-binaries (layer), etc."
  type        = string
}

variable "s3_bucket_id" {
  description = "ID of the S3 bucket to attach the upload notification to."
  type        = string
}

variable "s3_bucket_arn" {
  description = "ARN of the S3 bucket the scanner reads from and writes to."
  type        = string
}

variable "vpc_id" {
  description = "VPC the Lambdas and EFS file system live in."
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnets the Lambdas attach to. EFS mount targets are created in each. Must have egress to the internet (NAT) so freshclam can reach the ClamAV mirrors."
  type        = list(string)
}

variable "unscanned_prefix" {
  description = "Key prefix where uploads to be scanned arrive. The scanner triggers on objects created under this prefix."
  type        = string
  default     = "unscanned/"
}

variable "scanned_prefix" {
  description = "Key prefix where clean files are moved after a successful scan."
  type        = string
  default     = "scanned/"
}

variable "infected_prefix" {
  description = "Key prefix where infected (and otherwise unscannable) files are quarantined. Must match the prefix the API/file-scan stream expect."
  type        = string
  default     = "infected/"
}

variable "api_base_url" {
  description = "Base URL of the API the scanner posts results to, e.g. https://api.dev.simpler.grants.gov. The scanner calls POST <api_base_url>/v1/files/<file_id>."
  type        = string
}

variable "file_scan_api_key" {
  description = "API key the scanner sends as the X-API-Key header. Authenticates as the internal scanner user (INTERNAL_S3_SCAN privilege). Sourced from SSM by the caller."
  type        = string
  sensitive   = true
}

variable "file_scan_cache_table_name" {
  description = "Name of the DynamoDB scan-cache table the scanner updates with file scan status."
  type        = string
}

variable "dynamodb_write_policy_arn" {
  description = "ARN of the IAM policy granting write access to the DynamoDB scan-cache table. Attached to the scanner Lambda's role."
  type        = string
}

variable "freshclam_schedule" {
  description = "EventBridge cron / rate expression for refreshing virus definitions. ClamAV's mirrors request clients update at most once per hour."
  type        = string
  default     = "rate(6 hours)"
}

variable "scanner_memory_size" {
  description = "Scanner Lambda memory in MB. ClamAV loads signatures into RAM so this needs to be ~1.5 GB or more."
  type        = number
  default     = 10240
}

variable "scanner_timeout" {
  description = "Scanner Lambda timeout in seconds. Lambda max is 900."
  type        = number
  default     = 900
}

variable "scanner_dlq_retention_seconds" {
  description = "How long the scanner DLQ retains failed event payloads. Max is 1209600 (14 days)."
  type        = number
  default     = 1209600
}

variable "scanner_reserved_concurrency" {
  description = "Reserved concurrent executions for the scanner Lambda. Bounds parallel scans so a burst of uploads can't exhaust the account-wide Lambda quota or overwhelm EFS. Set to -1 to leave concurrency unreserved."
  type        = number
  default     = 10
}

variable "scanner_provisioned_concurrency" {
  description = "Number of execution environments to keep warm for the scanner Lambda via provisioned concurrency."
  type        = number
  default     = 0
}

variable "scanner_max_file_size_bytes" {
  description = "Maximum object size the scanner will download to /tmp. Files above this threshold are moved to the failed prefix with an explicit reason rather than failing with a confusing disk-space error. Default is 450 MiB to leave headroom under Lambda's 512 MiB /tmp limit."
  type        = number
  default     = 471859200
}

variable "alert_email_subscriptions" {
  description = "Email addresses subscribed to the ClamAV alerts SNS topic (infected files, freshclam failures, DLQ buildup). Each subscription must be confirmed out-of-band via the AWS confirmation email."
  type        = list(string)
  default     = []
}

variable "dlq_alarm_threshold" {
  description = "Number of visible messages on the scanner DLQ that triggers the buildup alarm."
  type        = number
  default     = 1
}

variable "newrelic_entity_guid" {
  description = "New Relic entity GUID to associate the forwarded ClamAV (scanner + freshclam) logs with. Set this to the API's New Relic entity GUID for the environment so ClamAV logs land on the same entity as the API logs. When null, logs are still shipped to the New Relic account but aren't bound to a specific entity."
  type        = string
  default     = null
}
