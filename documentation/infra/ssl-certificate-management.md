# SSL/TLS Certificate Renewal Runbook

Our `simpler.grants.gov` certificates are issued by HHS (HydrantID), imported into
[AWS Certificate Manager (ACM)](https://docs.aws.amazon.com/acm/latest/userguide/acm-overview.html),
and looked up by Terraform by domain name. They do **not** renew themselves: every
certificate has to go through the steps below before it expires, and the round trip
through HHS can take a couple of weeks.

```
0. Open a ticket  →  1. Create CSR  →  2. Submit to HHS  →  3. Receive signed cert
  →  4. Import to ACM  →  5. Verify live  →  6. Store the key  →  7. Close the ticket
```

> [!IMPORTANT]
> A certificate is not renewed until the **live site** serves the new certificate.
> Receiving the signed certificate from HHS is the halfway point, not the end. In
> November 2026 `files.simpler.grants.gov` and `data.simpler.grants.gov` went down
> because the signed certificates arrived two weeks early but were never imported.
> The ticket for each certificate stays open until step 5 is done.

## When to start

Start a renewal **at least 30 days** before a certificate expires. Triggers:

- The HHS "HydrantID ACM Certificate Expiry Report" email lists a domain we own.
- The expiry check below shows a certificate expiring within 45 days.

### Check what is expiring

Certificates live in the ACM of the AWS account that serves the domain (prod and the
`*.teams` environments are in the prod account). In each account, run:

```bash
aws acm list-certificates --region us-east-1 \
  --includes keyTypes=RSA_2048,RSA_4096 --certificate-statuses ISSUED EXPIRED \
  --query "sort_by(CertificateSummaryList,&NotAfter)[?InUse].[NotAfter,DomainName,Status,CertificateArn]" \
  --output table
```

To check what a site is actually serving:

```bash
echo | openssl s_client -connect files.simpler.grants.gov:443 -servername files.simpler.grants.gov 2>/dev/null \
  | openssl x509 -noout -subject -enddate
```

## Step 0 — Open a renewal ticket for each certificate

Open one ticket per domain with the
[**Internal - Reoccuring Task - SSL Certificate Renewal**](https://github.com/HHS/simpler-grants-gov/issues/new?template=10_internal_reoccuring_ssl_cert.yml)
issue template. Fill in the domain and the expiry date, and assign an owner. The
template's checklist mirrors the steps in this runbook; check items off as you go.

One ticket per domain matters: HHS often returns several certificates in a single
email or zip, and a shared ticket makes it easy to finish one domain and lose track of
the others.

## Step 1 — Create a CSR

```bash
bin/create-csr files        # files.simpler.grants.gov
bin/create-csr soap.training  # soap.training.simpler.grants.gov
bin/create-csr              # simpler.grants.gov
```

The script writes `<domain>.key` and `<domain>.csr` to `/tmp`. **Move both out of
`/tmp` right away** (for example into `certs/`, which is git-ignored) and complete
[Step 6](#step-6--store-the-private-key) for the key now, so it is not lost before
HHS replies. Without the key the signed certificate is useless and you have to start
over.

## Step 2 — Submit the CSR to HHS

Email the `.csr` file(s) to the HHS Office of Grants IT contact and copy
`grants-alerts@navapbc.com`. Link the email thread in the ticket.

If HHS has not replied within a week, follow up, and note it on the ticket.

## Step 3 — Receive and check the signed certificate

HHS replies with a zip. **A zip can contain certificates for more than one domain**
even when it is named after one of them, so unzip it and look at every file. Record on
each matching ticket that its certificate arrived.

A typical zip contains, per domain:

- `<domain>.cer`: the signed certificate
- `<domain>_chain.cer`: the certificate followed by the HydrantID intermediate and the root

If a file is binary rather than text starting with `-----BEGIN CERTIFICATE-----`,
convert it to PEM first and use the converted file in the commands below:

```bash
openssl x509 -inform DER -in files_simpler_grants_gov.cer -out files_simpler_grants_gov.pem
# or, for a .p7b bundle:
openssl pkcs7 -inform DER -print_certs -in files_simpler_grants_gov_chain.p7b -out files_simpler_grants_gov_chain.pem
```

Confirm the certificate matches your private key. The two hashes must be identical:

```bash
openssl x509 -in files_simpler_grants_gov.cer -noout -pubkey | openssl sha256
openssl pkey -in files.simpler.grants.gov.key -pubout | openssl sha256
```

ACM's `--certificate-chain` must **not** include the certificate itself, so drop the
first certificate from the chain file:

```bash
awk '/BEGIN CERTIFICATE/{n++} n>=2' files_simpler_grants_gov_chain.cer > files.chain.pem
openssl verify -CAfile files.chain.pem files_simpler_grants_gov.cer   # expect: OK
```

## Step 4 — Import into ACM

Re-import **over the ARN that is currently in use**. The ARN stays the same, so
CloudFront and the load balancers pick up the new certificate on their own and no
Terraform change or deploy is needed.

Find the ARN in use for the domain:

```bash
aws acm list-certificates --region us-east-1 \
  --includes keyTypes=RSA_2048,RSA_4096 --certificate-statuses ISSUED EXPIRED \
  --query "CertificateSummaryList[?DomainName=='files.simpler.grants.gov' && InUse].CertificateArn" \
  --output text
```

This must print exactly one ARN. Then import:

```bash
aws acm import-certificate --region us-east-1 \
  --certificate-arn <arn from above> \
  --certificate fileb://files_simpler_grants_gov.cer \
  --private-key fileb://files.simpler.grants.gov.key \
  --certificate-chain fileb://files.chain.pem
```

`bin/import-certificate` (`make infra-import-certificate`) does the same thing, but it
looks up the existing ARN by domain name only, which fails when ACM holds more than one
certificate for the domain (for example an old expired one). Prefer the explicit
command above, and delete expired, unused certificates for the domain afterwards so
the lookup stays unambiguous.

If this is a brand new domain with no certificate in ACM yet, import without
`--certificate-arn`, then follow [Custom domains](./custom-domains.md) to attach it
with Terraform.

## Step 5 — Verify the live site

Load balancers switch over within a minute or two; CloudFront distributions can take
several minutes.

```bash
echo | openssl s_client -connect files.simpler.grants.gov:443 -servername files.simpler.grants.gov 2>/dev/null \
  | openssl x509 -noout -enddate
```

The `notAfter` date must be the new one. Also load a real page or file from the site
in a browser. Paste the output on the ticket.

## Step 6 — Store the private key

Store the private key in Secrets Manager, in the same account and region as the ACM
certificate, so that the next person can re-import without starting over:

```bash
aws secretsmanager create-secret --region us-east-1 \
  --name certificates/files.simpler.grants.gov/private-key \
  --secret-string file://files.simpler.grants.gov.key
# on later renewals:
aws secretsmanager put-secret-value --region us-east-1 \
  --secret-id certificates/files.simpler.grants.gov/private-key \
  --secret-string file://files.simpler.grants.gov.key
```

Then delete the local copies of the key.

## Step 7 — Close the ticket

Close the ticket only when every checklist item is done, including the live check in
step 5. If HHS sent certificates for other domains in the same zip, make sure each of
those tickets has been updated too.
