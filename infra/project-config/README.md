# Common module

The purpose of this module is to contain environment agnostic items. e.g. tags that are common to all environments are stored here.

## Usage

```terraform
# Import the common module

module "project_config" {
  source = "../../project-config"
}

# Combine common tags with environment specific tags.
tags = merge(module.project_config.default_tags, {
  environment = "dev"
  description = "Backend resources required for terraform state management."
})
```
