locals {
  # Map from feature flags to their default values (true or false)
  feature_flag_defaults = {
    # Example feature flags
    # FOO = false
    # BAR = false
  }
  feature_flags_config = merge(
    local.feature_flag_defaults,
    var.feature_flag_overrides
  )
}
