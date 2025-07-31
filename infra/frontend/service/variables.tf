variable "environment_name" {
  type        = string
  description = "name of the application environment"
}

variable "image_tag" {
  type        = string
  description = "image tag to deploy to the environment"
  default     = "315341936575.dkr.ecr.us-east-1.amazonaws.com/simpler-grants-gov-frontend:c3823b9d3eae8c685180392c9c645db53070f8f3"
}
