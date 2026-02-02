# Issue Body Linter Expectations

This automated linter checks GitHub project issues to ensure they contain required sections with proper formatting.

## Issue Types

The linter supports two types of issues:

### Deliverable Issues
Deliverable issues must contain two required sections:

1. **Acceptance Criteria** (`### Acceptance criteria`)
   - Must contain at least one checkbox item
   - Checkboxes can be checked `[x]` or unchecked `[ ]`
   - Example:
     ```
     ### Acceptance criteria
     - [ ] User can log in with valid credentials
     - [x] Error message displays for invalid credentials
     ```

2. **Metrics** (`### Metrics`)
   - Must contain at least one checkbox item
   - Checkboxes can be checked `[x]` or unchecked `[ ]`
   - Example:
     ```
     ### Metrics
     - [ ] Page load time under 2 seconds
     - [ ] 95% uptime achieved
     ```

### Proposal Issues
Proposal issues must contain one required section:

1. **Summary** (`### Summary`)
   - Must contain non-empty content
   - No specific formatting requirements beyond having content
   - Example:
     ```
     ### Summary
     This proposal outlines a new authentication system that will improve security and user experience.
     ```

## How the Linter Works

- The linter searches for section headers using case-insensitive matching
- For checkbox sections (Acceptance Criteria and Metrics), it looks for the pattern `[x]` or `[ ]`
- For the Summary section, it simply checks that content exists after the header
- Issues that fail validation will receive an automated comment with a link to this documentation

## How to Fix Linter Errors

If your issue fails the linter check:

1. Add the missing required section(s) for your issue type
2. Ensure checkbox sections contain at least one checkbox item
3. Ensure the Summary section contains descriptive text
4. The linter will re-check your issue on the next run
