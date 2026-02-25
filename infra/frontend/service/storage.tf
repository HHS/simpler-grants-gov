module "storage" {
  source       = "../../modules/storage"
  name         = local.bucket_name
  is_temporary = local.is_temporary
}
