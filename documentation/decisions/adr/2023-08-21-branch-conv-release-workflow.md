# Commit and Branch Conventions and Release Workflow

- **Status:** Accepted. <!-- REQUIRED -->
- **Last Modified:** 2023-08-21 <!-- REQUIRED -->
- **Related Issue:** [#185](https://github.com/HHS/grants-equity/issues/185) <!-- RECOMMENDED -->
- **Deciders:** Daphne Gold, Sammy Steiner, Billy Daly, Lucas Brown <!-- REQUIRED -->
- **Tags:** process, workflow, change management <!-- OPTIONAL -->

## Context and Problem Statement

This project needs standards for describing changes and introducing them into lower and production environments. 

The items that encompass this are:

* Git commit conventions
* Branch naming conventions
* Branch merge strategy
* Branching model
* Release workflow and naming convention

## Decision Drivers <!-- RECOMMENDED -->

The standards should be:

- documented
- easy-to-use and understand
- support agile processes
- efficient and not create uneccessary work or friction
- faciliate deployments to lower and production environments
- facilitate continous integration and delivery
- make it easy to revert features
- facilitate both internal and external contributions


## Options Considered

### Branch merge strategy

#### [squash and merge](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/about-pull-request-merges#squash-and-merge-your-commits) 

- **Pros**
  - A single commit for a PR makes it easier to see all changes introduced for an entire feature
  - Squashing commits lowers the cognitive load for developers writing commits to a branch
  - Github has a "squash and merge" feature which makes it easy to implement this strategy
- **Cons**
  - [atomic commits](https://github.blog/2022-06-30-write-better-commits-build-better-projects/#the-solution) are seen by many as important method for creating a clear and revertable history
  - Squashing, even in a small feature branch, means that each commit in the history does not have a minimal scope
  - Reverting changes is harder because individual changes that comprise a feature cannot easily be pulled out in the history

#### [rebase and merging commits](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/about-pull-request-merges#rebase-and-merge-your-commits)

The pros and cons for this strategy are described in reverse above. There is a higher congitive load for developers as each commit needs to be properly formatted, descriptive, and ideally atomic. However the history is more traversable if individual and tightly scoped commits are maintained.

### Git commit conventions

This encompasses the commit messages pushed to branches. This is tied to the decision to the branch merge strategy and assumes the use of the "squash and merge" strategy and github feature. The following options were considered:

#### No commit convention

- **Pros**
  - Developers don't need to worry about the format of a commit while working on features
  - Lower overhead for each commit for some contributors, promoting more frequent commits during development
  - Less to read through when composing the "squash and merge" commit message if commits are shorter
  - No tools or learning curve necessary
  - Encourages necessary context be given in code comments or documentation instead of commit history
- **Cons**
  - Individual messages in pull requests are harder to read as every developer might use a different format
  - It is easier to accidentally include poorly worded or formatted messages using the "squash and merge" tool
  - Developers need to consider how to word messages with each commit, instead of relying on a convention that describes how changes should be formatted

#### Conventional Commits

[Conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) is a specification for adding human and machine readable meaning to commit messages.

- **Pros**
  - Widely adopted
  - Extreme precision in messages, reduced ambiguity
  - Automatically generated CHANGELOGs
  - Makes it easier for people to contribute to your projects, by allowing them to explore a more structured commit history
  - CLI tools to facilitate adoption
- **Cons**
  - Learning curve for adoption
  - Less usfeul in a "squash and merge" strategy
  - Not used by supporting organization
  - While widely adopted, not universally embraced

#### "7 Rules" Convention

[The seven rules of a great Git commit message](https://cbea.ms/git-commit/#seven-rules) describes 7 widely adopted rules that are less presciptive than conventional commits, but still describe best practices.

- **Pros**
  - Widely adopted
  - Used by Github UI when editing or adding a file
  - CLI tools to facilitate adoption
  - Less prescriptive than conventional commits
- **Cons**
  - Learning curve for adoption
  - Less usfeul in a "squash and merge" strategy
  - Not used by supporting organization
  - While widely adopted, not universally embraced

### Branch naming conventions

This project will use `[github-username]/issue-[issue-number]-[feature-name]` convention for branch naming conventions.

### Branching model

#### Trunk Based Development

[Trunk Based Development](https://trunkbaseddevelopment.com/) is source-control branching model, where developers collaborate on code in a single branch called `main`.

- **Pros**
  - Widely adopted in general and preferred by the supporting engineering organization
  - Facilitates continuos integration 
  - Facilitates continuous delivery
  - Facilitates lean experiments
  - Simpler and more efficient than some other models
- **Cons**
  - Doesn't facilitate releasing multiple versions of software, which is necessary in some cases (but not envisioned on this project)

#### Gitflow

[Gitflow](https://nvie.com/posts/a-successful-git-branching-model/) uses feature branches and multiple primary branches. [Some argue](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow) it has fallen in popularity in favor of trunk based development, and was not seriously considered for this project.

### Release workflow and Code Reviews

The following conventions will be adopted:

- Pull Requests (PRs) will be merged directly into `main`. 
- PRs will be titled `[Issue N] Short description`
  - PRs with no issue should use `[Fix] Short description`
- PRs will follow, with small changes, the [Code Change Lifecycle / Contributing
](https://docs.google.com/document/d/1EyLYuKCv8xjpY26zR8cODl6SEXy9Mx_yAuZ6vS8cPp8/edit?skip_itp2_check=true&pli=1) guidelines and be documented in `CONTRIBUTING.md`
- Code reviews will follow, with small changes, the [Code Review Guidelines](https://docs.google.com/document/d/1pRtpg1ffLXcJn_yV_g90t1TlZjs7TLH2FfpS8DwW3_w/edit#heading=h.htn78a1hqoq)

### Release Workflow

- Changes `main` will be immediately deployed to a lower environment
- Releases will be made frequently and include a changelog of updates
- Releases will use [CalVer](https://calver.org/) versioning naming conventions

## Decision Outcome <!-- REQUIRED -->

This project will use:

- a trunk based development strategy with calendar versioned releases
- git commit conventions will not be enforced individual PR commits
- "squash and merge" stratey for merging PRs with a defined naming convention
- contribution and development practices will be documented in `CONTRIBUTING.md`, `READM.md`, and other documents in the repository


