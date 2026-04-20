# ADR: Frontend Route Name Patterns

- **Status:** Draft
- **Last Modified:** 2026-4-20
- **Related Issue:** None
- **Deciders:** ???
- **Tags:** Frontend Routing

## Context and Problem Statement

Currently there is a not a standard practice for naming our frontend routes, resulting in confusion around what routes should be created for which pages. The most glaring example of this is routes that have singular or plural structures without any sense of internal logic. For example, to view a single application you visit `workspace/applications/:id` whereas a single opportunity exists at `/opportunity`.

Developers and users with a clear understanding of what a page is, and what purpose it serves should have a correspondingly clear idea of where a page route should be within the application.

For purposes of this ADR we will focus on the question of singular vs plural segment names, as the larger information architecture is a larger question to be handled separately and on a case by case basis.

## Decision Drivers

- consistency with API
  - the importance of keeping frontend routes aligned with backend routes
  - It was determined that this is not an important factor in the decision. It is natural and expected for frontend and backend routes to be different
- internal consistency on frontend
  - the importance of maintaining a logically solid and understandable structure within the frontend application
  - This is a primary decision driver
- futureproofing / extensibility
  - How well does the chosen methodology scale, as the application takes on expanded functionality
  - This is a primary decision driver

## Options Considered

- all singular
- all plural
- singular for detail or single entity edit pages or as a default, plural for list pages or bulk edit pages

## Decision Outcome

We are recommending a structure where singular segments are used for detail or single entity edit pages or as a default, and plural for list pages or bulk edit pages. For example:

- opportunity detail at `/opportunity`
- application detail at `/workspace/application`
- application list at `/workspace/applications`
- application form edit at `workspace/application/:id/form/:id`
- award recommendation submission bulk edit at `/award-recommendation/:id/submissions`

### Positive Consequences

- each page maps logically to the name of the route it lives on
- flexible to allow for more future use cases

### Negative Consequences

- does not create a situation where route heirarchies are linear the way they might be on the API.
  - for example, a `create opportunity` button at the agency opportunities list page at `/opportunities` would link to `/opportunity/create` rather than `/opportunities/create`
  - this could cause some confusion if users are expecting all agency opportunity related pages to live within the same nested route heirarchy
- more conscious management of route names
  - somewhat easier mentally to think of all plurals or all singulars rather than figuring out which to use in which cases
