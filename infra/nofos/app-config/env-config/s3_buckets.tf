locals {
  # Renaming something in here might make terraform try (and fail) to re-create the buckets.
  # So just assuming you can't ever rename anything in here!
  # (except the environment variables eg. `env_var` those are always safe)
  s3_buckets = {}
}
