terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
    awscc = {
      source  = "hashicorp/awscc"
      version = ">= 1.63.0"
    }
  }
}
