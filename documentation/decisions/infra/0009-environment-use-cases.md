# Determining The Use Cases Of Our Environments

- **Status:** Active
- **Last Modified:** 2024-01-24
- **Related Issue:** [#1055](https://github.com/HHS/simpler-grants-gov/issues/1055)
- **Author:** Kai Siren
- **Deciders:** Aaron Couch, Alsia Plybeah, James Bursa, Michael Chouinard, Sammy Steiner

## Context and Problem Statement

At present we have two environments: `prod`, and `dev`. This setup is insufficient for a team of our size, so this ADR presents an alternative set of environments. The goal is for these environments meet our needs for years to come.

## Decision Drivers

Not having a dedicated place for spinning up testing environments makes certain kinds of changes impossible to test. You must instead "plan and pray" that the changes apply successfully. This can add hours to days to the amount of time it takes to successfully complete a task. `dev` should function as this environment.

Not having a dedicated environment that's always up to date with `main` (and doesn't have random testing changes) makes it harder for non-engineers to know what to test against. `staging` should function as this environment.

## Desired State

- `prod` - This environment will function identically to its existing behavior, wherein it is always the latest Github release.
- `staging` - This environment will function the way our current `dev` does, wherein it is always deployed from the `main` branch in Github.
- `dev` - This is a "wild west" environment to which anyone is allowed to push anything at any time.

## Implications On The `dev` Environment

What does it mean for a `dev` to be the "wild west"? Well, specifically:

- Any given engineer can "reserve" a part of dev that is not currently in use. Reserving dev looks like posting to #topic-engineering and saying _"Hi all, I'm going to be deploying `infra/api/database` this sprint to work on ticket 999"_. This sets the understanding that you will be repeatedly deploying to dev, from your laptop, for the duration of the sprint.
- When you initially reserve dev, you should assume that it is broken and must be "repaired" in some way before you can properly utilize it. You might be able to use it "as-is" if you are lucky, but that should not be relied upon.
- Dev can be left as-is when you are done with it. You are not obligated to "cleanup" after yourself when using dev.
- Dev should not contain anything of any great importance. If you were to wake up Monday morning to your special dev setup having been accidentally deleted, it should not represent a major setback in your plans.

## Out of Scope (for this ADR)

- Preview builds / branch builds, wherein every Github PR creates its only small application in dev
- Any security or authorization changes relating to dev / staging. Which is to say, they will remain available for the general public to stumble upon.
- Deploying multiple `dev` environments for multiple people to use concurrently.

## Decision Outcome(s)

The "decision" component of this ADR primarily involves refining and discussing the details of the _Implications On The `dev` Environment_ section. In practice that means comments or change requests on this document.

You may, for example, feel like dev should be cleaned up when you are done with it. If there are any such disagreements, then we should have a discussion about them!
