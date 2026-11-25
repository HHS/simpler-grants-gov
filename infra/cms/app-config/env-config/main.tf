locals {
  # The prefix is used to create uniquely named resources per terraform workspace, which
  # are needed in CI/CD for preview environments and tests.
  prefix = terraform.workspace == "default" ? "" : "${terraform.workspace}-"
}
