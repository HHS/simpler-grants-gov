#!/bin/bash
# Utility functions

# Retrieve the names of the applications in the repo by listing the directories in the "infra" directory
# and filtering out the directories that are not applications.
# Returns: A list of application names.
function get_app_names() {
  find "infra" -maxdepth 1 -type d -not -name "infra" -not -name "accounts" -not -name "modules" -not -name "networks" -not -name "project-config" -not -name "test" -exec basename {} \;
}

# Base 62 decode a string.
# Returns: String as base 10 number.
function base62_decode() {
  local digits="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
  local s=$1
  local n=0
  
  for ((i=0;i<${#s};i++)); do
    c=${s:$i:1}
    pos=${digits%%"$c"*}
    n=$((n*62 + ${#pos}))
  done
  
  echo $n
}
