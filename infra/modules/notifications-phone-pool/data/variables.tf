variable "regions" {
  type        = list(string)
  description = "List of AWS regions to search for existing phone pools. If not provided, defaults to current region only."
  default     = null
}