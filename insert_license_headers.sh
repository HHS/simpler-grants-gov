#!/bin/bash

# SPDX-License-Identifier: CC0-1.0
#
# This script inserts an SPDX license header at the top of all files in a Git repository
# that do not already have the header.
#
# Usage: ./insert_license_headers.sh

LICENSE_HEADER="// SPDX-License-Identifier: CC0-1.0"

for file in $(git ls-files); do
    if [ $(head -n 1 $file) != $LICENSE_HEADER ]; then
        echo "Inserting license header into $file"
        (echo $LICENSE_HEADER; cat $file) > /tmp/file
        mv /tmp/file $file
    fi
done
