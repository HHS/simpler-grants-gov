# Code Reviews

Code reviews are intended to help all of us grow as engineers and improve the quality of what we ship.
These guidelines are meant to reinforce those two goals.

## For reviewers

Aim to respond to code reviews within 1 business day.

Remember to highlight things that you like and appreciate while reading through the changes,
and to make any other feedback clearly actionable by indicating if it is an optional preference, an important consideration, or an error.

Don't be afraid to comment with a question, or to ask for clarification, or provide a suggestion,
whenever you don’t understand what is going on at first glance — or if you think an approach or decision can be improved.
Suggestions on how to split a large PR into smaller chunks can also help move things along.
Code reviews give us a chance to learn from one another, and to reflect, iterate on, and document why certain decisions are made.

Once you're ready to approve or request changes, err on the side of trust.
Send a vote of approval if the PR looks ready except for small minor changes,
and trust that the recipient will address your comments before merging by replying via comment or code to any asks.
Use "request changes" sparingly, unless there's a blocking issue or major refactors that should be done.

## For authors or requesters

Your PR should be small enough that a reviewer can reasonably respond within 1-2 business days.
For larger changes, break them down into a series of PRs.
If refactors are included in your changes, try to split them out into separate PRs.

As a PR writer, you should consider your description and comments as documentation;
current and future team members will refer to it to understand your design decisions.
Include relevant context and business requirements, and add preemptive comments (in code or PR)
for sections of code that may be confusing or worth debate.

### Draft PRs

If your PR is a work-in-progress, or if you are looking for specific feedback on things,
create a [Draft Pull Request](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/about-pull-requests#draft-pull-requests)
and state what you are looking for in the description.

### Re-requesting reviews after completing changes

After you make requested changes in response to code review feedback, please re-request reviews from the reviewers to notify them that the work is ready to be reviewed again.

## Advantages of code review

- catch and prevent bugs
- consistent code
- find shared code
- share knowledge

## Challenges of code reviews
- it can take long
- who to ask
- how do you know when is "enough" review
- what should I be reviewing
