---
applyTo: "frontend/tests/e2e/**/*.feature"
description: "Copilot guidance for testers when creating, updating, converting, or debugging frontend Gherkin E2E feature files."
---

# Copilot Tester Feature Guidance

# Branch Naming Policy
Branches should be named as:
	[github-username]/[issue-number]-[some vaguely relevant string]

## 1. Goals and Constraints
- Use feature files to align testing, engineering, product, and design on expected behavior.
- Minimize additional planning cost for feature teams.
- Preserve flexibility to pivot as functionality changes.

## 2. Feature Files

### 2.1 Creation Process
- Writing before or alongside development is preferred, but feature files do not block development.
- Test engineers collaborate with engineering, product, and design to define expected behavior.
- Create tickets during feature planning to track feature-file work.
- If feature files are written after development, base them on production behavior review, product-owner conversations, and existing documentation.

### 2.2 Review Process
- Feature files are authored by testing team members.
- Require review by at least one engineer and the relevant product owner.
- Reviewers must confirm comprehensive in-scope coverage, exclusion of out-of-scope behavior, and identification of manual-only scenarios.
- Merge only after required approvals are complete.

### 2.3 Updating Feature Files
- When feature behavior changes, update the feature files and related specs.
- Create a ticket for those updates and keep it paired with development work.
- Product owners are responsible for ensuring update tickets are created, assigned, and communicated to testing.

### 2.4 File Specifications
- Place feature files in frontend E2E feature-specific folders.
- Example: `frontend/tests/e2e/search/features`.
- Use `.feature` extension.
- Use dash-case filenames (lowercase).

### 2.5 Tags
- Each scenario should map to an end-to-end spec test.
- Add two or more grouping tags per scenario.
- Ensure tags match the approved tag list, or create/update ticket acceptance criteria when introducing a new tag.
- Keep tag usage compatible with Playwright grep workflows.
- Prefer assigning exactly one feature group tag and exactly one execution group tag per scenario.
- Use kebab-case tag names.
- Ensure tags used in Playwright specs match tags used in feature files and testing documentation.

#### Approved Feature Group Tags
- `@grantor`
- `@grantee`
- `@opportunity-search`
- `@apply`
- `@static`
- `@auth`
- `@user-management`

#### Approved Execution Group Tags
- `@smoke`: subset of tests for general availability and core functionality, kept small for fast frequent runs.
- `@core-regression`: important user-facing flows and key edge cases.
- `@full-regression`: broader coverage including persistence variants, toggles, export/copy URL, and static checks.
- `@extended`: currently skipped tests, minor external links, and low-risk static content.

#### Cadence Matrix
- `@smoke`: all PRs, local.
- `@core-regression`: merge to main and deploy to production, local and staging.
- `@full-regression`: daily, local and staging.
- `@extended`: weekly, local and staging.

#### Tag Governance
- If a new tag is required, the testing ticket must include acceptance criteria for creating the tag and usage guidance.
- The test execution logic should respect execution-group hierarchy, where broader runs include narrower groups.
- Maintain tag definitions centrally to avoid duplicate, rogue, or misnamed tags.
- Keep tag documentation updated with tag purpose and intended execution cadence.
- References:
- https://navasage.atlassian.net/wiki/x/HICZpw
- https://navasage.atlassian.net/wiki/x/IQBnnw

### 2.6 Scope
- Cover core functionality required to verify intended behavior.
- Include common negative scenarios and error handling.
- Split complex functionality across multiple feature files when needed.
- Document edge cases separately from primary feature behavior.
- Do not repeat functionality already specified well in existing feature files.

## 3. Specs

### 3.1 Creating Specs from Feature Files
- Treat feature files as the basis for one or more Playwright spec files.
- Translate each non-manual scenario into a corresponding spec test.
- Keep the spec test name aligned with the scenario name.
- Prioritize primary functionality first, then edge-case coverage.
- AI-assisted translation is allowed within project policy, but never include credentials, passwords, or confidential data.

### 3.2 Annotation
- Carry scenario tags into corresponding spec tests.
- Reflect each feature step in the spec, including inline comments when useful for traceability.
- Reference: https://navasage.atlassian.net/wiki/spaces/Grantsgov/pages/2674327585/Tech+Spec+E2E+Test+Groups

### 3.3 Playwright Tagging and Execution
- Prefer tags over Playwright annotations for grouping test runs.
- Assign shared tags at the `describe` group level by default.
- Use per-test tags only when a test intentionally differs from the group tagging strategy.
- Use Playwright `--grep` to target tags for local and CI runs.
- Regex matching with `--grep` may be used to target multiple tags when needed.
- Local runs can use CLI grep filtering; VS Code tag filtering may require running selected tests rather than one-click run-all.

### 3.4 CI Grouping Strategy
- Support dynamic tag-based execution in CI to run arbitrary test group subsets.
- For commonly used runs, provide thin wrapper jobs that pass fixed tags (for example smoke).
- Keep CI job configuration aligned with documented group names and cadences.

### 3.5 Test Fixture Selector Convention
- For Playwright form field fixture definitions, any field with `type: "dropdown"` must use a CSS id selector prefixed with `#` (for example `selector: "#application_type"`).

## 4. Additional Conversion Rules
- Use simpler, human-readable wording in Gherkin scenarios and steps.
- If there is only 1 row of data, do not use multi-row tables. Do hardcode values in the step instead.
- Do not add device-specific branching logic in Gherkin.
- Preserve original Playwright coverage and user-visible outcomes when converting from `.spec.ts` to `.feature`.
- Do not remove core validations to simplify wording.
- Use `frontend/tests/e2e/roadmap.spec.ts` as a conversion baseline example.

## 5. Reference
- Planning notes: https://docs.google.com/document/d/1w9oB4mOquB4SOAk5aJLF06wsiNA92-NEkPmk7rcAbiQ/edit?usp=sharing

## 6. Copilot Workflow Automation

When you ask "apply template of happy path.spec.ts":
- I will use `frontend/tests/e2e/apply/happy-path-sf424.spec.ts` as the reference template.
- I will create all its import files as well, so the new spec is fully functional and ready to run.

When you ask "Prep check-in for [spec file]":

- I will list all updated import files for the given spec file and the spec file itself.
- I will list all updated import files that are support files for the given spec file.
- I will ask if you want to run `npm run lint -- --fix` and `npx prettier --write` for those files.
- I will ask if you want to run the tests for the given spec file.
- I will ask if you want to create a pull request with the updated files, and if so, I will create the PR with a default title and description that you can edit before submission.
- I will ask if you want to link the PR to an existing ticket, and if so, I will prompt you for the ticket number and add it to the PR description.

Note: For "list all support files" for a spec file, I will include all direct imports that are updated, and any additional files you have explicitly identified as support files.