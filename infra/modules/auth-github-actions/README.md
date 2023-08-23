# AWS Federation for GitHub Actions

This module sets up a way for GitHub Actions to access AWS resources using short-lived credentials without requiring long-lived access keys and without requiring separate AWS identities that need to be managed. It does that by doing the following:

1. Set up GitHub as an OpenID Connect Provider in the AWS account
2. Create an IAM role that GitHub actions will assume
3. Attach an IAM policy to the GitHub actions role that provides the necessary access to AWS account resources. By default this module will provide the [AWS managed Developer power user access policy `PowerUserAccess`](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_job-functions.html)

## Related Implementations

Similar functionality is also implemented in the [oidc-github module in the Terraform Registry](https://registry.terraform.io/modules/unfunco/oidc-github/aws/latest) (see also [Nava's fork of that repo](https://github.com/navapbc/terraform-aws-oidc-github)), but since IAM is sensitive we chose to implement it ourselves to keep the module simple, easy to understand, and in a place that's within our scope of control.

## Reference

* [AWS - Creating OpenID Connect (OIDC) Providers](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html)
* [GitHub - Security Hardening with OpenID Connect](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
