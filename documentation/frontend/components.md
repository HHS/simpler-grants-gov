# Frontend Components

The Grants frontend is built on NextJS, and as such, uses React components for display and client side business logic. There are many types of components in the system that server different purposes, and to try to deal with the complexities of working with these components we have implemented a system for classification that helps with defining:

- where components live
- how they are defined in relation to each other
- where they are meant to be used
- how changes to shared components are managed

Frontend components are organized into four groups which will define how they are treated in terms of:

- location - where in the codebase the files for the components live
- testing - standards around how deeply they should be tested
- ownership - who is responsible for managing changes to them
- naming conventions - how they and the files they live in should be named
- heirarchical relationships - how they relate to other types of components
- interactions - how they interact with other services

## Core components

Core components are the key building blocks of the application. They are small, flexible, resistant to change, and can be used anywhere within the application.

### Location

Core components will live at /components/core. There should not be any need to nest much farther than this, as core components should be distinct.

### Testing

Core components should be tested up to and beyond full automated test coverage, to make sure any and all use cases are handled. Any potential variations in props should be reflected in tests, and any possible UI assertions should be run in each test.

### Ownership

Core components are owned by the application team collectively. In general, changes to a core component should be approved by an engineer from the team which owns the component, and it is most likely that the team that owns the component will also be doing any active development related to the component as well.

### Naming

Naming should make it clear that the core components can be used across the application Ex. `/components/core/GrantsButton` exports `GrantsButton` or `/components/core/GrantsButton` exports `GrantsButton`.

### Interactions

Generally, core components should not make API requests, and should not be asynchronous components. Any necessary async behavior should take place in a parent component. This will ensure that core components are easily tested and have a clear contract between props and UI.

In special cases, a core component can make an API request or have other asynchronous behavior, as long as the behavior is consistent across all use cases for the component. For example, a component that always renders the content fetched from a particular API endpoint could be a core component, whereas a component that displays dynamically fetched data based on an opportunity id should be a domain specific or local component.

What is important is that, while configuration can be supplied to a core component to customize it to fit a use case, the general behavior of a core component should not be use case specific.

### Interactions

Core components can make API requests, and can be asynchronous.

### Relationships

Core components can be used within any other non-shared component, and must be flexible enough to support this expectation.

## Domain specific components

Domain specific components are any components which are not core components - as they are in some way specific to certain usages in the app - and not local components - as they can be used outside of one particular page.

Domain specific components can be shared on any number of levels and used to support a variety of contexts. For example, a domain specific component may be designed to be shared by:

- all components related a feature such as Apply or Award Recommendation
- all components used by a more complex, higher level component

### Location

Domain specific components will live within /components/, under a subdirectory structure that speaks to the nature of how they are shared.

To follow the above examples:

- specific components related to the Apply feature could live within /components/apply
- specific components used by a complex WorkflowDiagram component could live within /components/WorkflowDiagram

Note that components comprising a complex component could also be shared within a feature or sub-site, creating something like /components/apply/WorkflowDiagram

### Testing

Domain specific components should have full test coverage, ensuring that all use cases within their shared domain are accounted for, though they do not need to be as exhaustively covered as core components.

### Ownership

Ownership for domain specific components is determined by the definition of their shared boundaries, and this depends on how domain ownership is defined within the team.

Whoever owns the domain related to the component owns the component. This means that domain specific components may be owned by the team at large, or by a smaller sub-team more immediately reponsible for the specific domain in question.

### Naming

There are no hard and fast rules around naming for domain specific components. However, some things to consider:

- if a domain specific component serves, or could serve, generally the same purpose as another component in the application, create a unique name for the component. This way we avoid the proliferation of multiple SearchResult or PageHeader components.

- if variations on a component will be shared for different contexts, make this clear in naming. For example, if there are two different table components for Apply and Find pages, use ApplyHeader and FindHeader to avoid any collision on the generic name Header.

### Interactions

Domain specific components can make API requests, and can be asynchronous.

### Relationships

Domain specific components can be used within other domain specific components, and any local components, pages or layouts.

## Local components

Local components are any components that are used in only one page within in the site. They are specific to certain experience and should not be reused elsewhere.

### Location

Local components will be located based on where they are used, within the /app directory. Following NextJS guidance, components local to a given page should live in a `_components` folder adjacent to the page. Complex components can be supported with subdirectories within the `_components` folder.

Note that any components that are local to a set of pages rather than a particular page are actually domain specific components, and should be treated as such. In order to not unnecessarily tightly couple the idea of routing structure with the ideas of features or teams, we will keep the location of domain specifc components distinct from the route based file structures.

### Testing

Local components should be tested for any use cases specific to where they will be used. They should have full coverage, but as they will not be designed to be flexible, the scope of testing does not need to go beyond their primary use case.

### Ownership

Local components are owned by whoever owns the page on which they live. This is likely the feature team responsible for the page. In the case of a static page or a page that is not explicitly owned by any team, the wider team can take collective ownership of the component.

### Naming

See naming conventions for domain specifc components.

### Interactions

Local components can make API requests, and can be asynchronous.

### Relationships

Local components can be used within other local components, pages or layouts.

## Other Components

### Pages

Pages are local by NextJS convention. They can include any other types of components, but in the interest of keeping components small, likely will largely use shared or local components.

### Layouts

Layouts are local by NextJS convention. They can include any other types of components, but in the interest of keeping components small, likely will largely use shared or local components.
