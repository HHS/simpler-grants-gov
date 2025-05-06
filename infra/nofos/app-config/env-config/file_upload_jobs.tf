locals {
  # Configuration for default jobs to run in every environment.
  # See description of `file_upload_jobs` variable in the service module (infra/modules/service/variables.tf)
  # for the structure of this configuration object.
  # One difference is that `source_bucket` is optional here. If `source_bucket` is not
  # specified, then the source bucket will be set to the storage bucket's name
  file_upload_jobs = {
    # Example job configuration
    # etl = {
    #   path_prefix  = "etl/input",
    #   task_command = ["python", "-m", "flask", "--app", "app.py", "etl", "<object_key>"]
    # }
  }
}
