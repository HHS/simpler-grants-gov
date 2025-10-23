locals {
  # Renaming something in here might make terraform try (and fail) to re-create the buckets.
  # So just assuming you can't ever rename anything in here!
  # (except the environment variables eg. `env_var` those are always safe)
  s3_buckets = {
    # s3_buckets[key].env_var must:
    #  - Start with the same prefix as the object key
    #  - End with BUCKET
    public-files = {
      env_var = "PUBLIC_FILES_BUCKET"
      public  = false # Changed from true to false - CloudFront CDN provides public access instead
      # paths[index].env_var must:
      #  - Start with the same prefix as it's parent bucket, minus the "BUCKET" suffix
      #  - Include the name of the path in some way, doesn't have to be verbatim
      #  - End with PATH
      #
      # path must start with a forward slash
      paths = [
        {
          path    = "/opportunity-data-extracts"
          env_var = "PUBLIC_FILES_OPPORTUNITY_DATA_EXTRACTS_PATH"
        },
      ]
    }
    draft-files = {
      env_var = "DRAFT_FILES_BUCKET"
      public  = false
      paths   = []
    }
    api-analytics-transfer = {
      env_var = "API_ANALYTICS_BUCKET"
      public  = false
      paths = [
        {
          path    = "/db-extracts"
          env_var = "API_ANALYTICS_DB_EXTRACTS_PATH"
        },
      ]
    }
  }
}
