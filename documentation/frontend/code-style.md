# Simpler Grants Code Style and Norms

Here you'll find documentation of decisions around how to handle questions of code style, so that the code can remain as clear and consistent as possible.

## Typing

Typings should be placed within the /types directory unless they will only be ever referenced locally within in the file where they are defined.

### In Tests

Do not feel bad about hacking around or otherwise not following best typing practices in order to solve problems with typing in unit or e2e test files. For example, a common pattern used in our unit test mocks which would not fly at all in application code goes like this:

```
jest.mock("some/mocked/file", () => ({
  originalFunction: (...args: unknown[]) => mockOriginalFunction(args) as unknown,
}));
```

### Interfaces vs Types

When establishing a new type or interface, and trying to decide which to use, follow the following guidelines:

- When in doubt, use a type
- If you're typing a primitive value, array or function, always use a type
- If you're typing an object, feel free to use an interface, especially if the interface may be used to extend another interface or type, or may be extended by another interface or type

## Variable Names

In general, follow Uncle Bob's rules for variable naming:

- https://medium.com/@pabashani.herath/clean-code-naming-conventions-4cac223de3c6
- or if you want the whole book https://bookshop.org/p/books/clean-code-a-handbook-of-agile-software-craftsmanship-robert-martin/8829316?ean=9780132350884&next=t&source=IndieBound

The main things to focus on are:

- don't abuse (or maybe even use) abbreviations
- think about searchability

Also, `camelCase` should be used by default. Objects coming in from outside sources, such as API response payloads, may use `snake_case`, and there is no need to avoid using snake case in those instances, but any newly defined variables within the Next.js app should use camel case.

### Promises

Constants that represent unresolved promises should be named `varNamePromise(s)`.

Constants that represent resolved promises should be named `resolvedVarName(s)`

For example:

```javascript
const bunnyPromises = getBunnyPromises();
const resolvedBunnies = Promise.all(bunnyPromies);
```

## Errors

When naming an "error" variable, it is our best practice to use the variable name `e` rather than `error` or `err`. This single character abbreviation breaks the rule of variable names above, but it is well established JS practice and avoids the shadowing of a reserved word (as with `error`) and the use of a slightly longer abbreviation (as with `err`).

Classes for different flavors of API errors are established in errors.ts, use those whenever you can.

## Testing

### Page Component Tests

Testing dynamic Next.js page-level components can be complex and often provides limited value when approached with traditional unit tests.

For page components:
- Prefer testing underlying logic, hooks, and child components directly.
- When coverage is needed, favor explicit assertions (e.g., presence of key headings, landmarks, or critical content) over structural or visual comparisons.

End-to-end or integration tests are generally a better fit for validating full page behavior.

## Page Metadata

By default page titles should follow the format:

`<Page Name> | Simpler.Grants.gov`
