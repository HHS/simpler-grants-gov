# Frontend Data Validation Guidelines

## Context

Data provided by users needs to be validated.

In order to ensure that data submitted directly to our API is properly validated, the API performs validation of inputs at multiple places, depending on use cases. For example, application form data is validated, but failed validation does not block the data from being saved. However, application submission is blocked if any forms contain invalid data.

As the frontend client relies on the API for handling all submitted data, it is possible for the client to rely on the API's validation rather than implementing its own, saving work and reducing complexity by avoiding re-implementing validation a second time. However, without client side validation, the client must submit data to the API in order to determine its validity, which has a number of drawbacks for the application and the user.

In this context, we should be considering how to approach the question of implementing validation both in general, and in individual cases, in order to make sure that we balance priorities between user experience, developer experience and development time.

## General Guidelines

For any given data submission situation, we should:

### Handle API side validation errors

When the API encounters validation errors it will return a response with a 422 error code. The response will also contain a list of validation errors which can be matched up to form fields to facilitate intelligently displaying the errors in the UI.

Validation warnings will be returned on the response in this shape:

```
{
	warnings: [
		{
		  field: string;
		  message: string;
		  type: string;
		  value: string | null; // should always be null
		}
	]
}
```

For example:

```
{
	warnings: [
		{
			field: '$.federal_action_type'
			message: "'federal_action_type' is a required property"
			type: 'required'
			value: null
		}
	]
}
```

### Make sure client side validation is run in the browser

The project includes a javascript form validation library called [zod](https://zod.dev/). This library can be used on the browser or in the NextJS server. Note, however, that implementing validation in server actions or in a NextJS API handler function, will still require submitting data to the server, so, while this in theory adds a layer of security, assuming that zod validations mirror the validations being done on the API side, this will not add too much value to the user beyond what we get from using only API side validation.

To benefit from client side validation, zod should be used within the browser rather than the server.

### Validate data sent to external systems

In any case where the client is sending data somewhere other than our own API, and we have certain expectations about the validity of the data, we should make sure that we're implementing validation somewhere before submission, since we can't rely on our own API to validate the data, or for the consuming system to validate in a predictable way. This is a valid use case for using zod on the NextJS server side if we prefer.

## Considerations

Some things to consider when thinking about whether or how to implement client side validation in any specific case:

### API / Client side parity

Since the code running in the client (javascript, likely a library such as zod) and the code running in the API (python, apiflask) are fundamentally different, any efforts to get 100% parity between client side and API side validation behavior will likely fail. In this context, while it is important that client side validation behavior mirrors API side behavior as closely as possible, the goal of implementing client side validation should not be 100% parity. Since the ultimate source of truth for validation is the API, any client side validation we set up should make sure to not get in the way of API side validation. What we wsant to avoid is a situation where the client sets up rules or behavior that could block submission of data that would actually be accepted by the API.

What his means in practice is:

- make sure that client side validation behavior errs on the side of being less restrictive than the API side validation
- don't worry if client side validation does not 100% match API side validation as long as what is being done client side is in line with the intent of API side validation, does not block submission of valid data, and is providing useful early feedback to users

### Level of effort and iterative approaches

Implementing client side validation is a non trivial piece of work, and maintaining it also has an ongoing cost. Client side validation is also something that should not be difficult to add to an existing form. For any forms communicating with our API, remember that the API will be performing validation that can be used by the client even if client side validation is not in place. In this context, especially when building out a prototype or MVP, consider whether client side validation is a necessary part of what you are building, or something that could be added later.

### Err on the side of allowing submission

If there is no immediate need to block submission of data, even if the data is dubiously valid, we should allow the data to be submitted to the API, and let the API make the final decision about validity. In some cases we may want to allow saving invalid data in order to promote a draft based, iterative user workflow.

### Accessibility and UX best practices

Especially when thinking about disabling or hiding buttons related to client side validation status, make sure you are considering accessibility and UX best practices.

### Make validation transparent

Users don't care where validation is happening, and introducing a situation where they might need to understand the layers of validation is something to avoid. As such, display for validation warnings or errors should be the same regardless of whether the warnings come from the frontend or backend.
