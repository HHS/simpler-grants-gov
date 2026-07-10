locals {
  # Metabase uses the analytics database instead of its own
  # Reference to the analytics database cluster for connection info
  database_config = {
    cluster_name = var.analytics_database_cluster_name
    app_username = "metabaseuser"
    schema_name  = "public" # Metabase uses the public schema in the metabase database
  }
}
