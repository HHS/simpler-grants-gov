locals {
  s3_buckets = {
    # s3_buckets[key].env_var must:
    #  - start with the same prefix as the object key
    #  - end with BUCKET
    public-files = {
      env_var = "PUBLIC_FILES_BUCKET"
      public  = true # handle with care!!! this makes your bucket public
      # paths[index].env_var must:
      #  - start with the same prefix as it's parent bucket, minus the "BUCKET" suffix
      #  - include the name of the path in some way, doesn't have to be verbatim
      #  - end with PATH
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
      paths   = []
    }
  }
}
