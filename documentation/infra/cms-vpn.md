# CMS VPN access

Content managers reach the Drupal CMS through an AWS Client VPN. Drupal has no public access. This page covers how the VPN is set up and how to give and remove access.

The decisions behind this setup are in the [CMS sign-in and network access ADR](../wiki/product/decisions/adr/2026-11-04-cms-sign-in-and-network-access.md).

## How it works

- The CMS runs in **staging** and **prod**, each in that environment's existing VPC. The infrastructure code is in `infra/cms`.
- Drupal runs in its own ECS cluster, behind an internal load balancer. There is no public load balancer.
- Only two things can reach Drupal's load balancer: the frontend service, which reads content from Drupal's API, and VPN users.
- VPN users can reach Drupal and the VPC's DNS resolver. They can't reach the API, databases, or any other service in the VPC.
- Drupal's hostname resolves only inside the VPC, through a Route 53 private hosted zone:

  | Environment | Hostname |
  | --- | --- |
  | staging | `cms.staging.simpler.grants.gov` |
  | prod | `cms.simpler.grants.gov` |

- Only traffic for the VPC goes through the VPN (split tunnel). Users' other internet traffic stays on their own connection.
- Each person signs in to the VPN with their own client certificate, then signs in to Drupal with their own Drupal account and MFA.
- Every VPN connection is logged to the CloudWatch log group `/aws/client-vpn/cms-<environment>-vpn`.

## One-time setup: certificates

The VPN needs two certificates in ACM in the simpler-grants-gov account before `infra/cms/service` can be applied:

| Certificate | ACM domain | Used for |
| --- | --- | --- |
| VPN server certificate | `vpn-server.cms.simpler.grants.gov` | The certificate the VPN endpoint presents to clients |
| Client CA certificate | `vpn-client-ca.cms.simpler.grants.gov` | The certificate authority (CA) that issues each person's client certificate |

Create both with [easy-rsa](https://github.com/OpenVPN/easy-rsa), following the AWS guide [Mutual authentication](https://docs.aws.amazon.com/vpn/latest/clientvpn-admin/mutual.html). Use the domains above as the certificates' common names, then import both into ACM with `aws acm import-certificate`.

Store the CA's private key in AWS Secrets Manager or the team's password manager. Never commit it. Whoever holds the CA key can issue VPN access.

## Give someone VPN access

Give VPN access at the same time as the person's Drupal account, after their access request is approved.

1. Issue a client certificate for the person with the CA, using their name or email as the common name. Each person gets their own certificate. Never share one.
2. Download the VPN client configuration:

   ```bash
   aws ec2 export-client-vpn-client-configuration \
     --client-vpn-endpoint-id "$(terraform -chdir=infra/cms/service output -raw vpn_endpoint_id)" \
     --output text > cms-<environment>.ovpn
   ```

3. Add the person's certificate and private key to the file, in `<cert>` and `<key>` blocks.
4. Send them the file through a secure channel, and point them to the [AWS VPN Client](https://aws.amazon.com/vpn/client-vpn-download/).

## Remove someone's VPN access

Remove VPN access at the same time as the person's Drupal account.

1. Revoke the person's certificate with the CA, and generate a new certificate revocation list.
2. Import the list into the VPN endpoint:

   ```bash
   aws ec2 import-client-vpn-client-certificate-revocation-list \
     --client-vpn-endpoint-id <endpoint id> \
     --certificate-revocation-list file://crl.pem
   ```

3. End any open sessions for that person with `aws ec2 terminate-client-vpn-connections`.

The revocation list isn't managed in Terraform, so running Terraform doesn't change it.
