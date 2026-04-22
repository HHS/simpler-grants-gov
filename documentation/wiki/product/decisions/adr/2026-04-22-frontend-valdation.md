# Frontend Form Validation

- **Status:** Active
- **Last Modified:** 2026-04-22
- **Related Issue:** NA
- **Deciders:** ???
- **Tags:** Frontend Form Validation

## Context and Problem Statement

User provided data needs to be validated.

In order to ensure that data submitted directly to our API is properly validated, the API performs validation of inputs at multiple places, depending on use cases. For example, application form data is validated, but failed validation does not block the data from being saved. However, application submission is blocked if any forms contain invalid data.

As the frontend client also submits its data to the API, it is possible for it to rely on the API's validation rather than implementing its own, saving work and reducing complexity by avoiding re-implementing validation a second time. However, without frontend validation, the client must submit data to the API in order to determine its validity, which has a number of drawbacks for the application and the user.

In this context, we should be considering how to approach the question of implementing frontend validation both in general, and in individual cases, in order to make sure that we balance priorities between user experience, developer experience and development time.

## Options Considered

- Backend validation only
- Frontend validation for 100% coverage of backend validation cases
- Frontend validation for critical coverage of backend validation cases
- Frontend validation on a case by case basis with consideration of tradeoffs and priorities

## Pros and Cons of the Options

### Backend only

#### Pros

- Requires the least frontend developer time
- A single source of truth for validation rules
- 1:1 parity between API and browser users

#### Cons

- No feedback to client without submitting data to API

### Full Frontend validation

In this scenario all data validated by the API would be validated using the same rules on the frontend as those in use in the API.

#### Pros

- Ensures that any failed validations are delivered to users immediately
- Allows for highest level of sophistication around data related UIs

#### Cons

- 100% parity between frontend and backend rules may not be possible due to differences in language, rules engines, etc.
- Requires either a huge amount of diligence to keep API and frontend validition rules aligned, or a complex system to automagically keep rules in sync across systems
- Highest level of frontend developer effort

### Critical Frontend validation

In this scenario any frontend data validation considered most critical to deliver to users prior to submission is done client side, with the rest done only on the API. Any validation performed client side is a subset of the validation performed on the API side.

#### Pros

- Ensures that critical failed validations are delivered to users immediately
- Does not require the frontend to perform validations when deemed potentially unreliable, difficult to keep in sync with API, or difficult to implement.

#### Cons

- Requires supporting a frontend validation system
- Someone will have to make decisions about which validation rules to support on frontend in each case, or the team will need to decide on guidelines to follow
- May lead to user confusion if some errors are only returned on submit

### Case by Case Frontend validation

In this scenario each form can be treated individually, and frontend validation can be implemented as deemed best by the feature team managing the form. Any validation performed client side is a subset of the validation performed on the API side.

#### Pros

- Ensures that failed validations are delivered to users immediately in cases where this is deemed important and feasible
- Does not expect all forms to have the same needs in terms of validations and user feedback
- Does not require the frontend to perform validations when deemed potentially unreliable, difficult to keep in sync with API, or difficult to implement

#### Cons

- Requires supporting a frontend validation system
- Someone will have to make decisions about which validation rules to support on frontend in each case, or the team will need to decide on guidelines to follow
- May lead to user confusion if some errors are only returned on submit

## Decision Outcome

**Case by Case Frontend validation**

### Why?

While some forms may not need frontend validation, and some may find it difficult to implement, others may need it and we should be flexible to support what is best for users.

### Next steps and unanswered questions

- There are examples of using [zod](https://zod.dev/) for frontend validation, but only within server actions. If we want to do client side validation for immediate feedback we should build a prototype of using zod on the client

## Notes

- In no case should the frontend perform additional blocking validation beyond what the API performs. This allows API and frontend client users to operate on the same contract in terms of acceptable data input.
- Remember that validation done on server actions is not instantaneous and still requires submitting data to the server. Validation performed here will not have the same benefits as true client side validation
- Display for validation warnings or errors should be the same regardless of whether the warnings come from the frontend or backend
- Understanding that frontend validation takes time to implement and effort to maintain, any decision to implement frontend validation should be made judiciously, taking into account the user and developer experience
- When frontend validation is implemented, the frontend is free to respond to failed validation however makes sense within the context beyond display. For example:
  - disable buttons
  - disable fields
  - hide buttons
  - hide fields
