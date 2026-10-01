# SSL/TLS Certificate Management

This document covers the workflow for obtaining and importing SSL/TLS certificates
for `simpler.grants.gov` environments.

## Overview

Certificates for this project are imported into
[AWS Certificate Manager (ACM)](https://docs.aws.amazon.com/acm/latest/userguide/acm-overview.html)
and then referenced by Terraform. The general workflow is:

```
1. Create CSR  →  2. Submit to HHS  →  3. Receive signed cert  →  4. Import to ACM  →  5. Reference in Terraform
```

Two helper scripts in `bin/` automate steps 1 and 4.

Both scripts automatically append `.simpler.grants.gov` to any short domain name
that does not already end with `.simpler.grants.gov`.

| Short input | Resolved domain |
|---|---|
| `api` | `api.simpler.grants.gov` |
| `simpler.grants.gov` | `simpler.grants.gov` (unchanged) |

---

## Step 1 — Create a CSR

```bash
# Pass the domain as a positional argument
make infra-create-csr api

# Or use the DOMAIN variable explicitly
make infra-create-csr DOMAIN=api
```

This generates a CSR, writing both to the `certs/`
directory (created automatically if it does not exist):

```
certs/
  api.simpler.grants.gov.key   
  api.simpler.grants.gov.csr 
```

Keep the `.key` file private. The `.csr` file is sent to HHS.

---

## Step 2 — Submit CSR to HHS

Send the `.csr` file to the HHS who will issue the certificate which we import in step 3.

---

## Step 3 — Import Certificate into AWS ACM

```bash
make infra-import-certificate DOMAIN=api CERTIFICATE_FILE=./certs/api.simpler.grants.gov.crt
```

The script will:
1. Locate the matching private key automatically (`certs/<domain>.key`)
2. Verify the certificate and private key match
3. Upload to ACM, updating an existing certificate in-place if one already exists for the domain

### Re-importing (renewing) a certificate

If an ACM certificate for the domain already exists, the script automatically
updates it in-place (same ARN) rather than creating a new one.

---

## Prerequisites

- [`openssl`](https://www.openssl.org/) — must be installed and available on your `PATH`

---
