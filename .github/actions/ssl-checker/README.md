## Development

To get an environment's actual ACM output to test against or validate fixes with

```
export AWS_PROFILE=prod
aws sso login
aws acm list-certificates --max-items 1000 --no-paginate --includes "keyTypes=RSA_1024,RSA_2048,RSA_3072,RSA_4096,EC_prime256v1,EC_secp384r1,EC_secp521r1" > certificates.json
```

You can run the compile/execute loop locally while making changes to the Typescript code

```
npx rollup --config rollup.config.mjs && node build/index.js
```

## Build

```
cd .github/actions/ssl-checker
npx rollup --config rollup.config.mjs
```

This builds to the dist/index.js file which documentation seems to indicate is the "right way" to run JS based actions. So the `action.yml` references the `dist/` JS file not the source Typescript file.

Built JS file should be committed/updated as well as the source/workflow changes. You may have to get a missing line feed at the end of the generated file when you try and commit. It will be auto-fixed by the commit hook, but you have to add that additional change to your staged commits to allow the commit to go through
