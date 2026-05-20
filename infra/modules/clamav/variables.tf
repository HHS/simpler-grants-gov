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

variable "failed_prefix" {
  description = "Key prefix where infected or errored files are moved."
  type        = string
  default     = "scan-failed/"
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
