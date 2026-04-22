# Bedrock Data Automation Terraform Module

This module provisions AWS Bedrock Data Automation resources, including the data automation project and blueprints.


## Overview

The module creates:
- **Bedrock Data Automation Project** - Main project resource for data automation workflows
- **Bedrock Blueprints** - Custom extraction blueprints configured via a list

## Important Notes

- **BDA uses its own internal service role** - This module does not create a custom IAM role for BDA. Bedrock Data Automation uses an AWS-managed internal service role for S3 access.
- **S3 bucket encryption** - S3 buckets used with BDA should use the KMS encryption key provided by the storage module.
- **Lambda permissions** - Any Lambda function invoking BDA must have S3 permissions for both input and output buckets (to upload documents and retrieve results) and KMS permissions (for the storage module's encryption key) directly attached to its execution role.

## Features
- Creates resources required for Bedrock Data Automation workflows
- Uses a `name` variable to prefix all resource names for uniqueness and consistency
- Supports both standard and custom output configurations
- Flexible blueprint creation from file paths or ARNs
- Complies with Checkov recommendations for security and compliance
- Designed for cross-layer usage (see project module conventions)

## Usage

```hcl
module "bedrock_data_automation" {
  source = "../../modules/document-data-extraction/resources"

  name  = "my-app-prod"

  blueprints = [
    "./schemas/invoice.json",
    "arn:aws:bedrock:us-east-1::blueprint/aws-managed-blueprint-id"
  ]

  standard_output_configuration = {
    document = {
      extraction = {
        granularity = {
          types = ["PAGE", "ELEMENT"]
        }
      }
    }
  }

  tags = {
    Environment = "production"
    ManagedBy   = "terraform"
  }
}
```

## Inputs

### Required Variables

| Name  | Description | Type | Required |
|-------|-------------|------|----------|
| `name` | Prefix to use for resource names (e.g., "my-app-prod") | `string` | yes |
| `blueprints` | List of blueprint file paths or ARNs. File paths create custom blueprints, ARNs reference existing blueprints. | `list(string)` | [] |


### Optional Variables

| Name | Description | Type | Default |
|------|-------------|------|---------|
| `standard_output_configuration` | Standard output configuration for extraction | `object` | `null` |
| `override_configuration` | Override configuration for standard BDA behavior | `string` | `null` |
| `tags` | Resource tags as key-value pairs | `map(string)` | `{}` |


#### `standard_output_configuration` Object Structure

Complex nested object supporting extraction configuration for audio, document, image, and video content types. Each content type supports:
- **extraction** - Category, bounding box, and granularity configuration
- **generative_field** - State and types for generative AI fields
- **output_format** (document only) - Additional file format and text format settings

See `variables.tf` for complete structure details.

## Outputs

| Name | Description |
|------|-------------|
| `bda_project_arn` | The ARN of the Bedrock Data Automation project |
| `access_policy_arn` | The ARN of the IAM policy for accessing the Bedrock Data Automation project |
| `bda_profile_arn` | The profile ARN for cross-region inference |
| `bda_blueprint_arns` | List of created blueprint ARNs |
| `bda_blueprint_names` | List of created blueprint names |
| `bda_blueprint_arn_to_name` | Map of blueprint ARNs to names |

## Resources Created

- `awscc_bedrock_data_automation_project.bda_project` - Main BDA project
- `awscc_bedrock_blueprint.bda_blueprint` - One or more blueprints (created from `blueprints` list)

## Project Conventions

- All resource names are prefixed with `var.name`
- For cross-layer modules, use the interface/data/resources pattern as described in project documentation
- Write code that complies with Checkov recommendations
- Follow Terraform best practices for naming and organization

## File Structure

- `main.tf` - Resource definitions
- `variables.tf` - Input variable definitions
- `outputs.tf` - Output values
- `providers.tf` - Provider configuration
- `README.md` - This documentation

## Examples

### Minimal Configuration
```hcl
module "bedrock_data_automation" {
  source = "../../modules/document-data-extraction/resources"

  name = "my-app"

  blueprints = [] # No custom blueprints
}
```

### With Standard Output Configuration
```hcl
module "bedrock_data_automation" {
  source = "../../modules/document-data-extraction/resources"

  name       = "my-app"
  blueprints = [] # Add file paths or ARNs here

  standard_output_configuration = {
    document = {
      extraction = {
        bounding_box = {
          state = "ENABLED"
        }
        granularity = {
          types = ["PAGE", "ELEMENT", "LINE"]
        }
      }
      generative_field = {
        state = "ENABLED"
      }
      output_format = {
        text_format = {
          types = ["MARKDOWN", "HTML"]
        }
      }
    }
    image = {
      extraction = {
        category = {
          state = "ENABLED"
          types = ["TABLES", "CHARTS"]
        }
      }
    }
  }
}
```

## Prerequisites

- AWS provider configured
- AWS Cloud Control provider (awscc) configured
- Appropriate AWS permissions to create Bedrock and IAM resources

## References

- [AWS Bedrock Data Automation](https://docs.aws.amazon.com/bedrock/latest/userguide/data-automation.html)
- [Project Terraform Conventions](../../../../.github/copilot-instructions.md)
- [Checkov Documentation](https://www.checkov.io/)
