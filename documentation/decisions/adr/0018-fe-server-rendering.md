## Context and Problem Statement

Next.js provides multiple ways of rendering a website, which have different commands: `next start` vs `next export`. For the platform, we need to determine which should be the default.

## Considered options

1.  Server rendering (`next start`): Generates the full HTML markup for a page on the server in response to navigation. Initial page data can be fetched on the server.
2.  Prerendering (`next export`): At compile time, a separate HTML file is generated for each URL. Only the initial state of the page is generated as static HTML. To display personalized data, client-side JS is required and the page's DOM is updated.

## Decision drivers

1.  The selected option should represent what we consider the preferred approach for the types of websites we're typically building with Next.js: authenticated, personalized web applications (claimant portals, compare tools, case management systems, etc).
2.  Reduce the need for third party dependencies or custom code, when a native option works just as well.
3.  A (reasonable) increase in cloud costs is acceptable if it results in a system that is more maintainable for software teams and the government in the long term.
4.  Prioritize end user experience above developer experience.

## Decision Outcome

Server rendering is the best option when the web application requires "live" data, such as the personalized sites we often build at Nava, like claimant portals or case management systems. Server rendering requires more upfront effort on the infra side, but it enables teams to achieve a clearer separation of concerns, and write less application code in the long run. This can translate to web applications that work well for a large spectrum of device and network conditions.

If a project team is building a site that renders the same content for every user, they can change their application to utilize [Next.js's static HTML export functionality](https://nextjs.org/docs/advanced-features/static-html-export) (prerendering). This flexibility to do either server rendering or prerendering within the same React framework is one benefit to using Next.js.

## Pros and Cons of the Options

### Server rendering

Pros

- Data fetching occurs on the server. The browser natively handles the page's loading state. This means less overall code to write, test, and maintain. An uncaught error on the server will be louder (in a good way) than an uncaught error on the client (which could result in a never ending spinner).
- Makes it easier to implement a clearer separation of concerns:
  - [Middleware](https://nextjs.org/docs/advanced-features/middleware) provide a place for enforcing auth, reading/setting secure cookies, setting HTTP headers, and redirects.
  - [Loaders](https://nextjs.org/docs/basic-features/data-fetching/get-server-side-props) provide a place for fetching all data required for rendering the page.
- Running page logic and rendering on the server makes it possible to send lighter payloads to the client. This approach can work well for a large spectrum of device and network conditions. [You can make your server fast, but you can't control the user's device or network](https://remix.run/docs/en/v1/pages/philosophy%23serverclient-model).
- Data fetching on the server enables accessing authenticated APIs (e.g. using [TLS mutual auth](https://www.cloudflare.com/learning/access-management/what-is-mutual-tls/) to talk to fetch data from a protected third-party API).
- Low effort to implement [dynamic routes](https://nextjs.org/docs/routing/dynamic-routes) (e.g `/claim/:claim_id`)
- [API routes](https://nextjs.org/docs/api-routes/introduction) can be created to handle other types of HTTP requests (POST, PUT, etc).
- Nice side benefit: Server rendering is the only option for [Remix](https://remix.run/). It may be easier, from an infra standpoint and as a conceptual model, to migrate to Remix if the Next.js apps we're building were server rendered.

Cons

- Requires infra resources to run the containerized application, and all the things that come along with a server (rate limiting, auto scaling), such as [AWS App Runner](https://aws.amazon.com/apprunner/). This can have higher costs than a prerendered site.
- Higher operational and compliance burden due to the above. Requires more effort to create documentation for security approvals due to a larger attack surface.

### Prerendering

Pros

- Great for mostly static sites, when the markup can be generated ahead of time.
- Minimal infrastructure is required. The prerendered HTML files can be served from a CDN, such as AWS CloudFront connected to an S3 bucket. Assuming other best practices are followed, like optimizing images and not loading MB's of client-side JS, this can translate to fast page loads and low costs.
- Lighter operational and compliance requirements. Security approval documentation is simpler due to a smaller attack surface, and on-call responsibilities are reduced.

Cons

- For sites with live/personalized data, pages would require client-side JS for data fetching. This has a few downsides:
  - Client-side JS is required for rendering the loading, success, and error states (e.g. `fetch`, `isLoading`, `useEffect`, `catch`). Teams need to define their own code patterns to manage this (e.g hooks, higher-order components) or install third-party dependencies (e.g. [React Query](https://react-query-v3.tanstack.com/)). This increases the amount of code to be written and maintained, and can increase code complexity. More code and complexity provides more opportunity for introducing bugs.
  - The prerendered HTML file is only a skeleton page in a pending state. Although the site might have a fast [First Paint](https://developer.chrome.com/docs/lighthouse/performance/first-contentful-paint), its [Time To Interactive](https://developer.chrome.com/en/docs/lighthouse/performance/interactive/) may still be slow.
- [Lacks support for Middleware, Internationalized Routing, API Routes, etc](https://nextjs.org/docs/advanced-features/static-html-export%23unsupported-features).

## Links

- https://18f.gsa.gov/2021/04/05/why_simplicity_choosing_a_web_architecture
- https://www.gov.uk/service-manual/technology/using-progressive-enhancement
- 🔒 [PFML comparison of current static approach vs a possible server rendering approach](https://drive.google.com/file/d/1Wgpl4q3ceJGKE5uLFH3iXUhefPxJdHcw/view)

Backends for Frontends:

- https://learn.microsoft.com/en-us/azure/architecture/patterns/backends-for-frontends
- https://philcalcado.com/2015/09/18/the_back_end_for_front_end_pattern_bff.html

Web rendering:

- https://deno.com/blog/the-future-and-past-is-server-side-rendering
- https://www.patterns.dev/posts/rendering-patterns/
- https://developers.google.com/web/updates/2019/02/rendering-on-the-web
- https://www.smashingmagazine.com/2022/04/jamstack-rendering-patterns-evolution
