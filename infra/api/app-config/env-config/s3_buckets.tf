locals {
  s3_buckets = {
    public-files = {
      env_var = "PUBLIC_FILES_BASE_PATH"
      public  = true
    }
    draft-files = {
      env_var = "DRAFT_FILES_BASE_PATH"
      public  = false
    }
    api-analytics-transfer = {
      env_var = "API_ANALYTICS_BASE_PATH"
      public  = false
    }
  }
}
