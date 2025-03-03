# Google Analytics

The Next app uses the Next third party Google library to add the necessary scripts for instantiating Google Analytics (GA) on the site. To control reporting to different Google Analytics properties, we point the site at a Google Tag Manager (GTM) account ID, which manages the creation of the correct GA tags based on hostname.

- When the hostname matches PROD (simpler.grants.gov), data will be reported to the production GA account
- If the hostname matches Staging or DEV hostnames, data will be reported to the dev GA account
- Otherwise a placeholder ID is used, and data will effectively be routed into the abyss

See the "GA IDs By Hostname" variable in our GTM account for details.

# New Relic

New Relic is a monitoring platform, used by the Simpler Grants team to:

- keep track of system performance across the full application
- track and visualize some product metrics
- generate alerts? (tbd)

New Relic UI is available at [https://one.newrelic.com/](https://one.newrelic.com/).

## Apps and Accounts

New Relic will be installed to monitor the following in DEV, Staging, and PROD environments:

- Next JS client and backend
- API
- Infrastructure (tbd)

Each deployed application / environment combination will have its own name to distinguish it, but all applications will reference the same license key (found in 1password).

The Simpler Grants team will have licenses for 4 admin users, 5 non-admin users. If you need access, please consult with your manager.

Admin users will have full access to the features available in New Relic's UI. Non-admin users will not have access to reatime AMP or Browser monitoring, but will have access to all dashboards. Any information that should be made available to non-admin users should be exported into a dashboard for their reference.

## Usage

### Custom Attributes / Events

New Relic does not collect search params on URLs by default for security reasons. We have implemented custom attributes on search page events to capture approved query param values. These custom attributes will all be prefixed with `search_param_`.

### Dashboards

Since non-admin users will only be able to consume metrics via dashboards, it is important for any important information to be surfaced in dashboards.

## Integration

Note that all integrations will require access to two pieces of information:

- `NEW_RELIC_APP_NAME`
- `NEW_RELIC_LICENSE_KEY`

### Browser

The browser monitoring code is added via the New Relic NPM package from the main Next JS layout file. Client side code and browser monitoring will work as long as the code is injected correctly by the Next backend into the client. From the client, `window.newrelic` can be accessed to perform any necessary customization.

Note that the `window.newrelic` object may not be available immediately upon page load, so timing needs to be considered whenever this object is referenced.

### Local

Generally you should not need run New Relic locally. By default `npm run dev` will run with the `NEW_RELIC_ENABLED` flag set to `false`. If you need to run the app with New Relic locally, run the app using the `start:nr` script and supply the `NEW_RELIC_APP_NAME` and `NEW_RELIC_LICENSE_KEY` variables via the command line when you start the app. For example:

```
npm run build -- --no-lint && NEW_RELIC_APP_NAME="Simpler Grants Next DEV" NEW_RELIC_LICENSE_KEY="<lisence key>" npm run start:nr
```

For testing locally in order to more closely emulate the deployed environment, see the considerations mentioned in the `deployed` section below.

### Deployed

Integration of New Relic into the client and Node processes will be handled by the New Relic Node package. The Node library is able to generate the necessary scripts for the client code to report back to New Relic. [See the layout file](https://github.com/HHS/simpler-grants-gov/blob/a2ce07dc15b65c9fa27ecbbe7a9566c84542b554/frontend/src/app/%5Blocale%5D/layout.tsx#L77) to see how this is being done.

#### Environment Variables

Environment variables containing the necessary New Relic configuration values (see above) for deployed environments are stored in SSM parameters and supplied to the app via ECS task definitions at the Next application's run time. (For more about the application's environments, [check documentation here](https://github.com/HHS/simpler-grants-gov/blob/main/documentation/frontend/environments.md)).

Since environment variables necessary for instantiating the New Relic code are only available at run time, we need to be careful to make sure that any implementation we have takes into account that any pages fully pre-rendered at build time may not have access to the New Relic code.

### Known Issues / Troubleshooting

- Currently we are generating the New Relic browser monitoring code using the New Relic Node package within the main app layout file. We have experimented with hardcoding and manually adding the code snippet instead. Hopefully we will not need to revisit this method, but if we do, keep in mind that we will need to double escape any backslashes in the code string, as single backslashes are removed at some point in the build process. Failure to add the extra backslashes will cause the script to fail.

- New Relic browser monitoring is somewhat unstable in our current implementation due to the timing of generation of the script within the main layout (at run time) coupled with the timing of generation for individual pages (sometimes at build). Since the app name and license key are supplied to the Next app at run time, while APM monitoring will work fine, any code that is rendered at build time will not have access to the configuration, meaning that client monitoring is more tricky. As of 2/25 the necessary New Relic script is loading on all pages in all environments.

- As our client side code expects New Relic configuration to be available when running `npm run build`, we will see warnings in our build logs related to this missing data.

- The Typescript types package for New Relic's Node implementation is lacking a bit. We are working around this in our code, but there is a ticket out to contribute back to the New Relic package as well so that we do not need to manage this ourselves. See https://github.com/HHS/simpler-grants-gov/issues/2982

- client side error: `ChunkLoadError: Loading chunk 478 failed.`
  - FIX: this happens locally when the script is blocked. Firefox tends to block, try running in Chrome.

## Resources

Here are some resources to reference when setting up or using New Relic on Next

- [New Relic NPM Package](https://www.npmjs.com/package/newrelic) - some setup directions here
- [Next JS Sample App](https://github.com/newrelic/newrelic-node-examples/tree/58f760e828c45d90391bda3f66764d4420ba4990/nextjs-app-router) - generally tried to follow this example when setting up our implementation
- [New Relic's installation guide for Node](https://docs.newrelic.com/docs/apm/agents/nodejs-agent/installation-configuration/install-nodejs-agent-docker/)
