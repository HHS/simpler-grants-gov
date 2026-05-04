# Application Documentation

## Introduction

- This is a [Next.js](https://nextjs.org/) React web application, written in [TypeScript](https://www.typescriptlang.org/).
- [U.S. Web Design System](https://designsystem.digital.gov) provides themeable styling and a set of common components.
- [React-USWDS](https://github.com/trussworks/react-uswds) provides React components already with USWDS theming out of the box. For a reference point starting out, see `react-uswds-hello.tsx` which includes examples of react-uswds component usage.
- [Storybook](https://storybook.js.org/) is included as a frontend workshop.

## Directory structure

```
├── .storybook        # Storybook configuration
├── public            # Static assets
│   └── locales       # Internationalized content
├── src               # Source code
│   ├── components    # Reusable UI components
│   ├── app           # Page routes and data fetching
│   │   └── api       # API routes (optional)
│   └── styles        # Sass & design system settings
├── stories           # Storybook pages
└── tests             # Unit and E2E tests
```

## 💻 Local Development

[Next.js](https://nextjs.org/docs) provides the React framework for building the web application. Pages are defined in the `app/` directory. Pages are automatically routed based on the file name. For example, `pages/[locale]/page.tsx` is the home page.

[**Learn more about developing Next.js applications** ↗️](https://nextjs.org/docs)

### Running the app locally

See [development.md](../documentation/frontend/development.md) for full installation and development instructions.

## Technical information

- [Architecture diagram](../documentation/architecture/README.md)
- [Authentication overview](../documentation/api/authentication.md)
- [Authentication local setup](../documentation/frontend/development.md#authentication)
- [Testing](../documentation/frontend/development.md#-testing)
- [Type checking, linting, and formatting](../documentation/frontend/development.md#-type-checking-linting-and-formatting)
- [Search and opportunity page local setup](../documentation/frontend/development.md#search-and-opportunity-pages)

Force a frontend change to test fork PR E2E tests
