<!--- # NOTE: Modify sections marked with `TODO` and then rename the file.-->

# How to Contribute (Intnernal)

The following guide is for members of the project team who have access to the repository.

## Local Development

This project is monorepo with several apps. Please see the [api](./api/README.md) and [frontend](./frontend/README.md) READMEs for information on spinning up those projects locally. Also see the project [documentation](./documentation) for more info.

### Linting and Testing

Each application has its own linting and testing guidelines. Lint and code tests are run on each commit, so linters and tests should be run locally before commiting.

## Branching Model

This project follows [trunk-based development](https://trunkbaseddevelopment.com/), which means:

* Make small changes in [short-lived feature branches](https://trunkbaseddevelopment.com/short-lived-feature-branches/) and merge to `main` frequently.
* Be open to submitting multiple small pull requests for a single ticket (i.e. reference the same ticket across multiple pull requests).
* Treat each change you merge to `main` as immediately deployable to production. Do not merge changes that depend on subsequent changes you plan to make, even if you plan to make those changes shortly.
* Ticket any unfinished or partially finished work.
* Tests should be written for any change introduced.

This project uses **continuous deployment** using [Github Actions](https://github.com/features/actions) which is configured in the [./github/worfklows](./github/workflows) directory.

Pull-requests are merged to `main` and the changes are immediately deployed to the development environment. Releases are created to push changes to production.

## Writing Pull Requests

Prefix the branch name with your name, and include the ticket number in the branch name e.g. `cooldev/issue-1234-new-feature`.

Commit messages should, but are not required, to follow [git best practice conventions](https://cbea.ms/git-commit/#seven-rules) for consistency and legibility. Commit messages will be squashed, so individual commit messages will only be visible in the commit history of the pull request.

### Title

Pull request should have the following format: `[Issue N] Description`. The description should follow the imperative voice and lack of period from the [git best practice conventions](https://cbea.ms/git-commit/#seven-rules).

### Recommendations

**Use draft PRs to solicit early feedback.**

If your PR is a work-in-progress, or if you are looking for specific feedback on things, create a Draft Pull Request and state what you are looking for in the description.

**Provide context for current and future team members.**
Write a full description that provides all the necessary context for your change. Consider your description as documentation. Include relevant context and business requirements, and add preemptive comments (in code or PR) for sections of code that may be confusing or worth debate.

**Make things easy for your reviewers.**

Do a self-review using the diff in github to make sure you’re not sending through any obvious issues. Run any automations (testing, linters, etc.) before opening your PR.

If any manual testing was performed, document it in enough detail in the PR description that somebody else could recreate your test. Include reference to your test data, if applicable!

### Reviewers

Assign reviewers applicable to the domain of your pull request. See [CODEOWNERS](./github/CODEOWNERS) for more details.

### Pull in Own Requests

Once a PR is accepted by a reviewer, the author should merge.

### Squash Merge

This project uses the squash merge strategy. When squashing, retain the `[Issue N] Description` format. Any notes in the body of the commit should follow commit best practices.

All changes, including small ones, should have an issue. If they don't `[Hotfix]` should be used in lieu of the issue and number.

## Reviewing Pull Requests

This project takes a very collaborative and [agile](https://agilemanifesto.org/) approach to code reviews. Working versions of code, self-organizing, and individuals are prioritized When reviewing pull requests:

* **Be prompt**. Aim to respond to a review within 24 hours (although sooner is preferable), and if you cannot do so, be sure to communicate delays to the code author.
* **Be kind and respectful** when leaving comments and maintain a collaborative tone. Don’t use language that disparages or embarrasses the author (name calling, insults to intelligence, etc). Direct any negative feedback towards the code rather than towards the author.
* **Present suggestions as requests rather than demands**; instead of “Move this function to file B” try “Would this function fit better in file B?” This allows the author to push back on the suggestion by answering a question rather than rejecting a demand, which helps keep things from getting combative.
* **Praise and compliment** the good parts!
* **Explain suggestions and recommendations**. These should be opportunities for learning/mentoring, not for criticism or giving orders.
* **Offer to chat in person** for more complex discussions, or to ensure understanding of new logic.
* **Review the testing** as well as the code. You may think of edge cases or other things that the author’s testing plan might have missed.
* **Clearly designate between required and optional changes**. This can take many forms, but as examples: “(optional) We might want to rename this variable to avoid confusion” and “(blocking) We don’t properly handle deadlocks here, so we’ll need to fix that.” It may also be helpful to clearly designate praises, questions, nits, etc to make a comment’s intention very clear.
* Consider using **[conventional comments](https://conventionalcomments.org/)** for messages.
* Use the **"Add a suggestion"** feature to suggest small changes in PRs.
  
![add a suggestion pop-up](https://github.com/HHS/grants-equity/assets/512243/e08efbd3-91de-43ce-a0d5-4529ccb1ac13)

* **The "Request Changes"** feature *requires* the reviewer approve changes. This takes autonomy from the engineer, and should only be used if there is an urgent need.

## Releases

Releases follow the [CalVer](https://calver.org/) versioning using a `YYY.MM.DD` format. Optionally include a `-N` if more than one releases are published in the same day.

Releases should be [created in Github](https://github.com/HHS/grants-equity/releases) and include a log of changes.

## Documentation

Any changes to features, tools, or workflows should include updates or additions to documentation.
