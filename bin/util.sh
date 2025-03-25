#!/bin/bash
# Utility functions

# Retrieve the names of the applications in the repo by listing the directories in the "infra" directory
# and filtering out the directories that are not applications.
# Returns: A list of application names.
function get_app_names() {
  find "infra" -maxdepth 1 -type d -not -name "infra" -not -name "accounts" -not -name "modules" -not -name "networks" -not -name "project-config" -not -name "test" -exec basename {} \;
}
