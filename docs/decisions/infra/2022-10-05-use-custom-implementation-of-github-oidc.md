# Use custom implementation of GitHub OIDC to authenticate GitHub actions with AWS rather than using module in Terraform Registry

- Status: accepted
- Deciders: @shawnvanderjagt @lorenyu @NavaTim
- Date: 2022-10-05 (Updated 2023-07-12)

## Context and Problem Statement

[GitHub recommends using OpenID Connect to authenticate GitHub actions with AWS](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect). There are [existing modules in the Terraform Registry](https://registry.terraform.io/search/modules?q=github%20actions%20oidc) that implement these resources. Should we use an existing module or implement our own?

## Decision Drivers

- Secure
- Maintainable
- Simple and easily understood

## Considered Options

- Use [unfunco/oidc-github](https://registry.terraform.io/modules/unfunco/oidc-github/aws/latest) module from Terraform registry
- Use a fork of [unfunco/oidc-github](https://registry.terraform.io/modules/unfunco/oidc-github/aws/latest) in [NavaPBC GitHub org](https://github.com/navapbc)
- Use a custom implementation

## Decision Outcome

We chose to use a custom implementation because it allowed for the simplest implementation that was easiest to understand while still being in our full control and therefore avoids security issues with external dependencies. It is also easy to upgrade to use the external module if circumstances change.

## Pros and Cons of the Options

The [unfunco/oidc-github](https://registry.terraform.io/modules/unfunco/oidc-github/aws/latest) module from Terraform registry is effectively what we need, but there are a few disadvantages to using it:

Cons of unfunco/oidc-github:

- Dependency on an external module in the Terraform registry has negative security implications. Furthermore, the module isn't published by an "official" organization. It is maintained by a single developer, further increasing the security risk.
- The module includes extra unnecessary options that make the code more difficult to read and understand
- In particular, the module includes the option to attach the `AdminstratorAccess` policy to the GitHub actions IAM role, which isn't necessary and could raise concerns in an audit.
- ~~The module hardcodes the GitHub OIDC Provider thumbprint, which isn't as elegant as the method in the [Initial setup for CD draft PR #43](https://github.com/navapbc/template-infra/pull/43) from @shawnvanderjagt which simply pulls the thumbprint via:~~ (Update: July 12, 2023) Starting July 6, 2023, AWS began securing communication with GitHub’s OIDC identity provider (IdP) using GitHub's library of trusted root Certificate Authorities instead of using a certificate thumbprint to verify the IdP’s server certificate. This approach ensures that the GitHub OIDC configuration behaves correctly without disruption during future certificate rotations and changes. With this new validation approach in place, your legacy thumbprint(s) are longer be needed for validation purposes.

Forking the module to the @navapbc organization gets rid of the security issue, but the other issues remain.
