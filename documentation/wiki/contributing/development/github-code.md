---
description: User guide for contributing code to our GitHub.
---

# GitHub - Code

GitHub is our primary platform for collaborative software development within the Simpler Grants community. This guide will help you get started and make the most out of your code contribution experience.

## Getting Started

### 1. Clone the Repository

* Clone the forked repository to your local machine using the following command
* Instructions on setting up the local development environment can be found in the repo:
  * [Api Development Instructions ](../../../api/development.md)
  * [Front end Development Instructions](../../../../frontend/)

### 2. Create a Fork

* Create a new fork for your changes using the following command:
  * fork names should conform to the Simpler Grants naming convenation:
    * \<github username>/\<GitHub Issue #>-simple-ticket-description
    * ex. btabaska/1234-updating-api-with-new-header



<pre><code><strong>// feature-branch-name should be replaced a name that conforms to our branch naming schema
</strong>git checkout -b feature-branch-name
</code></pre>

### 3. Make Changes & Commit Changes

* Make your desired changes or additions to the codebase using your preferred code editor.

### 4. Push Changes

* Push your changes to your forked repository on GitHub using the following command:

```
// feature-branch-name should be replaced a name that conforms to our branch naming schema
git push origin feature-branch-name
```

### 5. Create a Pull Request

* Navigate to your forked repository on GitHub and click on the "Pull Request" button.
* Fill out the pull request form:

```
## Summary
Fixes #(ISSUE)
// Update the issue with a link to the issue on github

### Time to review: ___x mins___
// Update the x with an estimate of how long you think the PR will take to review

## Changes proposed
>
// Update with a short description of what you changed to provide context for people putting together a release, developing a test plan, etc

## Context for reviewers
>
// Update with a short description of what you changed to provide context for the PR reviewer

```

* Submit the pull request for review by other engineers within the community.

## Contributing Guidelines

### 1. Code Style and Standards

* Follow the established code style and standards outlined within Simpler Grants  [contributing guidelines](../../../../CONTRIBUTING.md).
* Use clear and descriptive variable names, comments, and documentation where necessary.

### 2. Testing

* Write tests for your code changes to ensure they function as expected.
* Run existing tests and ensure they pass before submitting your pull request.

### 3. Documentation

* Update any relevant documentation or README files to reflect your code changes.

## Review Process

### 1. Reviewers

* Assign reviewers to your pull request who are knowledgeable about the project and can provide valuable feedback.

### 2. Feedback and Iteration

* Address any feedback or comments from reviewers promptly and make necessary changes.
* Iterate on your code as needed until it meets the project's standards and requirements.

### 3. Merge and Deployment

* Once your pull request is approved, it will be merged into the main branch and deployed as necessary.

## Change log

Major updates to the content of this page will be added here.

<table><thead><tr><th>Date</th><th width="246">Update</th><th>Notes</th></tr></thead><tbody><tr><td>2/12/2024</td><td>Initial Content</td><td>Updated with Initial content</td></tr><tr><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td></tr></tbody></table>
