variable "environment_name" {
  type        = string
  description = "Logical environment this stub service belongs to. Used to name resources and the backend state file."
  default     = "infra-dev"
}

variable "network_name" {
  type        = string
  description = "Name (VPC 'Name' tag) of the VPC to deploy the stub into. Must match a network created by infra/networks."
  default     = "infra-dev-grants-management"
}

variable "service_name" {
  type        = string
  description = "Base name for the stub service resources."
  default     = "sgm"
}

variable "region" {
  type        = string
  description = "AWS region for the stub service."
  default     = "us-east-1"
}

variable "image_tag" {
  type        = string
  description = "Tag of the image to run from the stub's ECR repo. Push an nginx image to that repo under this tag before applying."
  default     = "latest"
}

variable "cpu" {
  type        = number
  description = "Fargate task CPU units."
  default     = 256
}

variable "memory" {
  type        = number
  description = "Fargate task memory (MiB)."
  default     = 512
}

variable "desired_count" {
  type        = number
  description = "Number of stub tasks to run."
  default     = 1
}
