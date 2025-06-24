#!/usr/bin/env bash

# This is a script to run setup for doing development on the simpler soap api.
# The certificates must be downloaded from OnePassword and then unzipped.
# The path of that unzipped file must be passed to this script and defaults to
# the ~/Downloads folder.
#
# Example usage:
#    ./setup-soap.sh
#
# If you unzipped the certs folder within ~/Destop you can run:
#   ./setup-soap.sh ~/Desktop
#

SOAP_ENV_FILE="soap-api.env"
DEFAULT_SOAP_CERT_DIR=$HOME/Downloads/

# Handle specified certificate directory if provided, otherwise use default.
if [ "$1" ]; then
  soap_cert_directory="${1%/}/grants_s2s_soap_certs/localsetup/"
  echo "soap-setup: Using certificate directory path ${soap_cert_directory}"
else
  soap_cert_directory="$DEFAULT_SOAP_CERT_DIR/grants_s2s_soap_certs/localsetup/"
  echo "soap-setup: Using default certificate path ${soap_cert_directory}"
fi

# Check if the certifcates have already been setup skip if already exists.
if [ -e "$SOAP_ENV_FILE" ] && grep -Eq '^SOAP_AUTH_CONTENT[[:space:]]*=[[:space:]]*[^[:space:]]+' $SOAP_ENV_FILE; then
  echo "soap-setup: SOAP_AUTH_CONTENT already set, skipping setup"
  exit 0
else
  echo "soap-setup: Creating $SOAP_ENV_FILE since it does not exist"
fi

# The following variables should not be changed within the downloaded certificates folder.
applicants_base_cert_name='staging_applicants_soap_api'
grantors_base_cert_name='staging_grantors_soap_api'
applicantspub=$soap_cert_directory$applicants_base_cert_name.crt
applicantspk=$soap_cert_directory$applicants_base_cert_name.key
grantorspub=$soap_cert_directory$grantors_base_cert_name.crt
grantorspk=$soap_cert_directory$grantors_base_cert_name.key

for file in $applicantspub $applicantspk $grantorspub $grantorspk; do
  if [ ! -e "$file" ]; then
    if [ "$1" ]; then
      err_dir="${1%/}/"
    else
      err_dir=$DEFAULT_SOAP_CERT_DIR
    fi
    echo -e "soap-setup: Missing $file aborting soap setup. \n\nDouble check that $err_dir contains the /grants_s2s_soap_certs folder\n"
    exit 0
  fi
done

soap_auth_content=$(printf '{"%s": "%s\n\n%s","%s": "%s\n\n%s"}' \
"`openssl x509 -in $applicantspub -noout -fingerprint -sha256 | sed 's/://g' | cut -d'=' -f2 | tr '[:upper:]' '[:lower:]'`" "`cat ${applicantspk}`" "`cat ${applicantspub}`" \
"`openssl x509 -in $grantorspub -noout -fingerprint -sha256 | sed 's/://g' | cut -d'=' -f2 | tr '[:upper:]' '[:lower:]'`" "`cat ${grantorspk}`" "`cat ${grantorspub}`")

echo "soap-setup: Setting SOAP_AUTH_CONTENT in $SOAP_ENV_FILE"
cat <<EOF >> "$SOAP_ENV_FILE"

#############################################
# SOAP Auth for proxying training locally
#############################################
SOAP_AUTH_CONTENT=$(printf '%s' "$soap_auth_content" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')
EOF

echo "soap-setup: Setup complete!"
