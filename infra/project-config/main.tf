locals {
  # Machine readable project name (lower case letters, dashes, and underscores)
  # This will be used in names of AWS resources
<<<<<<< before updating
<<<<<<< before updating
  project_name = "simpler-grants-gov"

  # Project owner (e.g. navapbc). Used for tagging infra resources.
<<<<<<< before updating
  owner = "navapbc"
=======
  owner = "HHS"
>>>>>>> after updating

  # URL of project source code repository
  code_repository_url = "https://github.com/HHS/simpler-grants-gov"
=======
  project_name = ""

  # Project owner (e.g. navapbc). Used for tagging infra resources.
  owner = ""

  # URL of project source code repository
  code_repository_url = "https://github.com//"
>>>>>>> after updating
=======
  project_name = ""

  # Project owner (e.g. navapbc). Used for tagging infra resources.
  owner = ""

  # URL of project source code repository
  code_repository_url = "https://github.com//"
>>>>>>> after updating

  # Default AWS region for project (e.g. us-east-1, us-east-2, us-west-1).
  # This is dependent on where your project is located (if regional)
  # otherwise us-east-1 is a good default
<<<<<<< before updating
<<<<<<< before updating
  default_region = "us-east-1"
=======
  default_region = "us-east-2"
>>>>>>> after updating

<<<<<<< before updating
  github_actions_role_name                = "${local.project_name}-github-actions"
  aws_services_security_group_name_prefix = "aws-service-vpc-endpoints"
=======
  github_actions_role_name = "${local.project_name}-github-actions"
<<<<<<< before updating
>>>>>>> after updating
=======
  default_region = "us-east-2"

  github_actions_role_name = "${local.project_name}-github-actions"
>>>>>>> after updating
=======
>>>>>>> after updating
}
