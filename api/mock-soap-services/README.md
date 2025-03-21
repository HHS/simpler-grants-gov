# Mock SOAP API Service
This is application is an emulation of the grants.gov S2S SOAP API. The purpose of this application is consume requests from the /api and return responses that the actual S2S SOAP API would return in test and production environments.

You can read more about the live S2S SOAP API in the [following resource](https://www.grants.gov/system-to-system).

## Tooling
This services utilizes the following libraries:
- [Imposter](https://docs.imposter.sh/) - Library to create mock APIs and services.
- [soapui](https://www.soapui.org/) - This is only utilized for generating WSDLs that can be utilized with Imposter and the XML schemas.

## Services
This local server will emulate the following 2 SOAP API services within grants.gov:
- [Applicants](https://www.grants.gov/system-to-system/applicant-system-to-system)
- [Grantors](https://www.grants.gov/system-to-system/grantor-system-to-system/)

## Generating WSDL and XML schemas with soapui
...