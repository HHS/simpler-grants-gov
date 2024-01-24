# Determining The Use Cases Of Our Environments

- **Status:** Active
- **Last Modified:** 2024-01-24
- **Related Issue:** [#1055](https://github.com/HHS/simpler-grants-gov/issues/1055)
- **Author:** Kai Siren
- **Deciders:** Aaron Couch, Alsia Plybeah, James Bursa, Michael Chouinard, Sammy Steiner

## Context and Problem Statement

At present we have two environments: `prod`, and `dev`. This setup is insufficient for a team of our size, so this ADR presents an alternative set of environments. The goal is for these environments meet our needs for years to come.

## Decision Drivers

- Having less non-prod environments than we have infrastructure engineers makes it almost a certainty that people will become blocked on each other, often for days at a time.
- Not having a dedicated place for spinning up testing environments makes certain kinds of changes impossible to test. You must instead "plan and pray" that the changes apply successfully. This can add hours to days to the amount of time it takes to successfully complete a task.

## Desired State

The proposed desired state is one where we have `N >= 3` environments. Specifically:

- `prod` - This environment will function identically to its existing behavior, wherein it is always the latest Github release.
- `staging` - This environment will function the way our current `dev` does, wherein it is always deployed from the `main` branch in Github.
- `dev-M` - This will be some number of environments to which anyone is allowed to push anything at any time. The `dev-M` notation represents a linear series of dev environments, eg. `dev-1` (or just `dev`), `dev-2`, `dev-3`, etc etc. During normal development, `1 <= M <= {total number of engineers}`. There should always be at least one dev env, idling and waiting for use. There can be any number (`M`) more dev envs, reliant entirely on our needs at the time.

## Characteristics of a Good Dev Environment

This section details some additional attributes that compose a good dev environment. Consider each item on this list to be a "decision" that we can approve or deny. Feel encouraged to add more items to this list.

- Dev environments should not be accessible to the public.
- Dev environments can be spun up at any time, as long as the current number of dev environments (`M`) is less than `{total number of engineers}`.
- Dev environments can be left idle when you are done with them. You are not obligated to "cleanup" after yourself when using a dev environment.
- We should strive to make spinning up dev environments quick and easy.
- If data is required inside of a dev environment, that data should be seeded from staging. Whether that happens via ETL, or via snapshot, is out of scope for this ADR.
- Dev environments should not contain anything of any great importance. If you were to wake up Monday morning to your dev environment having been accidentally deleted, it should not represent a large setback in your plans.
- A given engineer can "reserve" a dev engineer that is not currently in use. Reserving an environment looks like posting to #topic-engineering and saying _"Hi all, I'm going to be using dev-1 this sprint to work on ticket 999"_.
- If you reserve an existing dev environment, you should assume that it is broken and must be totally deleted before you can properly utilize it. You might be able to use it "as-is" if you are lucky, but that should not be relied upon.

## Decision Outcome(s)

The "decision" component of this ADR involves determining what we feel like is a "Good Dev Environment". In practice that makes comments or change requests on the section immediately prior to this one.

You may, for example, feel like dev environments should immediately be deleted when they are no longer in use. If there are any such disagreements, then they should be logged in this section as decisions we made during the ADR review process.
