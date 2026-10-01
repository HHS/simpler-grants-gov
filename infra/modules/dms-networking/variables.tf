variable "our_vpc_id" {
  type = string
}

variable "our_cidr_block" {
  type = string
}

variable "grants_gov_oracle_cidr_block" {
  type = string
}

variable "environment_name" {
  type = string
}

variable "transit_gateway_id" {
  type        = string
  default     = null
  description = "Route the Oracle CIDR through this transit gateway instead of the VPC peering"
}
