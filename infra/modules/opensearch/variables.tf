variable "availability_zone_count" {
  description = "The number of availability zones in the OpenSearch domain"
  type        = number
}

variable "cidr_block" {
  description = "The CIDR block of the VPC"
  type        = string
}

variable "dedicated_master_enabled" {
  description = "Whether to enable dedicated master nodes"
  type        = bool
}

variable "dedicated_master_count" {
  description = "The number of dedicated master nodes in the OpenSearch domain"
  type        = number
}

variable "dedicated_master_type" {
  description = "The instance type of the dedicated master nodes in the OpenSearch domain"
  type        = string
}

variable "engine_version" {
  description = "The version of OpenSearch to deploy"
  type        = string
}

variable "instance_count" {
  description = "The number of instances in the OpenSearch domain"
  type        = number
}

variable "instance_type" {
  description = "The instance type of the OpenSearch domain"
  type        = string
}

variable "multi_az_with_standby_enabled" {
  description = "Whether to enable multi-AZ with standby"
  type        = bool
}

variable "name" {
  description = "The name of the OpenSearch domain"
  type        = string
}

variable "subnet_ids" {
  description = "The subnet IDs of the VPC"
  type        = list(string)
}

variable "volume_size" {
  description = "The EBS volume size of the OpenSearch domain"
  type        = number
}

variable "vpc_id" {
  description = "The ID of the VPC"
  type        = string
}

variable "zone_awareness_enabled" {
  description = "Whether to enable zone awareness"
  type        = bool
}
