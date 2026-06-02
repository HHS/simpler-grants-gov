# Template-Infra v0.17.0 Upgrade - Completion Summary

This document confirms that simpler-grants-gov has completed the upgrade from template-infra v0.16.0 to v0.17.0.

## v0.17.0 Key Changes

### ✅ S3 State Locking Migration (COMPLETED)
**Status:** Fully migrated

- **What changed:** Switched from DynamoDB-based state locking to native S3 state locking
- **Evidence:** `infra/example.s3.tfbackend` contains `use_lockfile = true`
- **Migration:** Completed via `bin/migrate-terraform-state-locking-to-s3` script
- **Reference:** [Migration documentation](./migrate-terraform-state-locking-to-s3.md)

### ✅ Document Data Extraction Module (AVAILABLE)
**Status:** Infrastructure ready

- **What's new:** Customizable file identification and structured data extraction
- **Configuration:** `infra/{{app_name}}/app-config/env-config/document_data_extraction.tf`
- **Features implemented:**
  - Document block for field-level extraction (#1039)
  - Blueprint change handling (#1028)
  - Integration with AWS Bedrock Data Automation

### ✅ SMS Notifications Support (AVAILABLE)
**Status:** Infrastructure ready

- **What's new:** SMS notification capability similar to existing email support
- **Network:** VPC endpoint created when SMS feature is enabled
- **Usage:** Can be enabled per-service in environment configuration

### ✅ Playwright Update (COMPLETED)
**Status:** Updated

- **What changed:** Updated from Playwright 1.49.0 to 1.56.1
- **Location:** `e2e/package.json`
- **Benefit:** Latest E2E testing capabilities

## Infrastructure Layer Updates

| Layer            | Changes | Status |
|------------------|---------|--------|
| Account          | AWS service permissions for DDE/SMS | ✅ Complete |
| Network          | VPC endpoints for new services | ✅ Complete |
| Build Repository | No changes | N/A |
| Database         | No changes | N/A |
| Service          | DDE module, SMS support | ✅ Complete |
| CI/CD            | No changes | N/A |

## Migration Steps Taken

1. ✅ Ran `bin/migrate-terraform-state-locking-to-s3 --reinit`
2. ✅ Verified all `.s3.tfbackend` files use S3 native locking
3. ✅ Confirmed DDE configuration present
4. ✅ Verified Playwright updated to v1.56.1
5. ✅ Ran terraform plans for all layers (see PR comments)

## Next Steps for Application Teams

- **Document Data Extraction:** Review [template-infra DDE docs](https://github.com/navapbc/template-infra/blob/main/docs/infra/document-data-extraction.md) if planning to use this feature
- **SMS Notifications:** Can be enabled per-environment in service configuration if needed

## References

- [template-infra v0.17.0 Release Notes](https://github.com/navapbc/template-infra/releases/tag/v0.17.0)
- [S3 State Locking Migration Guide](./migrate-terraform-state-locking-to-s3.md)

---

**Issue:** #9837
**Date Completed:** 2026-06-02
