## Google Analytics

The Next app uses the Next third party Google library to add the necessary scripts for instantiating Google Analytics (GA) on the site. To control reporting to different Google Analytics properties, we point the site at a Google Tag Manager (GTM) account ID, which manages the creation of the correct GA tags based on hostname.

- When the hostname matches PROD (simpler.grants.gov), data will be reported to the production GA account
- If the hostname matches Staging or DEV hostnames, data will be reported to the dev GA account
- Otherwise a placeholder ID is used, and data will effectively be routed into the abyss

See the "GA IDs By Hostname" variable in our GTM account for details.
