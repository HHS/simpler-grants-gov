locals {
  jobs_buckets = {
    export-opportunity-data = {
      bucket_name = "export-opportunity-data"
      env_var     = "EXPORT_OPPORTUNITY_BASE_PATH"
      public      = false
    }
  }
}
