# GitHub user story workflow

This workflow standardizes outcome quality while allowing teams to adapt implementation details.

## Source of truth

- Use GitHub issues as the source of truth for user stories and related tickets.
- Use repository feature files as test artifacts derived from acceptance criteria, not as the user story itself.
- Keep one parent user story issue and link all related child tickets.

## Ticket hierarchy

1. User Story (parent)
2. Tech Task (child)
3. Test Task (child)
4. Demo Task (child)
5. Bug (child, as needed)

## Label conventions

- Use one ticket type label per issue:
   - `type:user-story`
   - `type:tech-task`
   - `type:test-task`
   - `type:demo-task`
   - `type:bug`
- Use one workflow-state label:
   - `workflow:requirements`
   - `workflow:approved-for-implementation`
   - `workflow:in-development`
   - `workflow:in-test`
   - `workflow:ready-for-demo`
   - `workflow:done`
- Use one story reference label for all child tickets and related PRs:
   - `story:US-<id>` (example: `story:US-142`)
- Use a shared-impact label when cross-product regression is required:
   - `risk:shared-component`

## Workflow stages

1. Gather requirement
   - Create User Story issue with summary, business value, acceptance criteria, and shared functionality impact.
2. Review and sign off for implementation
   - Product and test engineering approvals are recorded in User Story issue.
3. Create child tickets
   - Open Tech Task, Test Task, and Demo Task tickets linked to the User Story.
4. Refine
   - Clarify assumptions, dependencies, and scope updates in User Story refinement notes.
5. Implement and validate
   - Developers complete Tech Task checklist.
   - QC completes Test Task checklist and links evidence.
6. Ship readiness
   - Confirm acceptance criteria coverage and shared component regression.
   - Close child tickets, then close parent User Story.

## Required documentation by stage

1. Requirement intake
   - User Story issue body
2. Implementation planning
   - Tech Task issue body
3. Test planning and execution
   - Test Task issue body and evidence links
4. Demo readiness
   - Demo Task script and artifacts
5. Defect handling
   - Story Bug issue with reproduction and retest evidence

## Task expectations under each ticket type

### User Story
- Summary
- Acceptance criteria
- Shared functionality impact
- Sign-off for implementation
- Child ticket links

### Tech Task
- Analyze ticket and approach
- Implementation details
- Unit test updates
- PR and code review completion

### Test Task
- Create or update feature files
- Feature review with product owner
- Automation coverage and regression scope
- Test automation peer review

### Demo Task
- Demo script
- Readiness checks
- Demo artifacts

### Story Bug
- Reproduction steps
- Expected vs actual behavior
- Severity
- Fix and retest evidence
