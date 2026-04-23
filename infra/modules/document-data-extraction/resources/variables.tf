variable "name" {
  description = "Prefix to use for resource names"
  type        = string
}

variable "blueprints" {
  description = "List of AWS managed blueprint ARNs (stage defaults to LIVE)"
  type        = list(string)
  default     = null
}

variable "custom_output_config" {
  description = "A list of the BDA custom output configuartion blueprint(s)."
  type = list(object({
    blueprint_arn     = optional(string)
    blueprint_stage   = optional(string)
    blueprint_version = optional(string)
  }))
  default = null
}

variable "standard_output_configuration" {
  description = "Standard output is pre-defined extraction managed by Bedrock. It can extract information from documents, images, videos, and audio."
  type = object({
    audio = optional(object({
      extraction = optional(object({
        category = optional(object({
          state = optional(string)
          types = optional(list(string))
        }))
      }))
      generative_field = optional(object({
        state = optional(string)
        types = optional(list(string))
      }))
    }))
    document = optional(object({
      extraction = optional(object({
        bounding_box = optional(object({
          state = optional(string)
        }))
        granularity = optional(object({
          types = optional(list(string))
        }))
      }))
      generative_field = optional(object({
        state = optional(string)
      }))
      output_format = optional(object({
        additional_file_format = optional(object({
          state = optional(string)
        }))
        text_format = optional(object({
          types = optional(list(string))
        }))
      }))
    }))
    image = optional(object({
      extraction = optional(object({
        category = optional(object({
          state = optional(string)
          types = optional(list(string))
        }))
        bounding_box = optional(object({
          state = optional(string)
        }))
      }))
      generative_field = optional(object({
        state = optional(string)
        types = optional(list(string))
      }))
    }))
    video = optional(object({
      extraction = optional(object({
        category = optional(object({
          state = optional(string)
          types = optional(list(string))
        }))
        bounding_box = optional(object({
          state = optional(string)
        }))
      }))
      generative_field = optional(object({
        state = optional(string)
        types = optional(list(string))
      }))
    }))
  })
  default = null
}

# override_configuration allows customizing extraction behavior beyond standard
# settings:
#  - enabling document splitting
#  - skipping certain modalities (audio, video, text)
#  - adjusting routing rules (e.g. whether JPEG files are routed to document or image processing)
#  - etc.
#
# the base configuration is sufficient for most use cases, hence the null default
# documentation: https://docs.aws.amazon.com/bedrock/latest/APIReference/API_data-automation_OverrideConfiguration.html
variable "override_configuration" {
  description = "Configuration state for the BDA override."
  type = object({
    document = optional(object({
      splitter = optional(object({
        state = optional(string)
      }))
    }))
    # add image, video, audio later if needed
  })
  default = null
}

variable "tags" {
  description = "A map of tags for associated resources."
  type        = map(string)
  default     = {}

}
