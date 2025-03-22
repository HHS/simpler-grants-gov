# Mock SOAP API Service
This is application is an emulation of the grants.gov S2S SOAP API. The purpose of this application is consume requests from the /api and return responses that the actual S2S SOAP API would return in test and production environments.

You can read more about the live S2S SOAP API in the [following resource](https://www.grants.gov/system-to-system).

## Tooling
This services utilizes the following libraries:
- [Imposter](https://docs.imposter.sh/) - Library to create mock APIs and services.
- [SoapUI](https://www.soapui.org/) - This is only utilized for generating WSDLs that can be utilized with Imposter and the XDS schemas.

## Services
This local server will emulate the following 2 SOAP API services within grants.gov:
- [Applicants](https://www.grants.gov/system-to-system/applicant-system-to-system)
- [Grantors](https://www.grants.gov/system-to-system/grantor-system-to-system/)

## Generating WSDL and XML schemas with SoapUI
There are some issues when utilizing the WSDLs and xsd schemas directly from the browser for the existing SOAP S2S service.
1. Download SoapUI Open Source GUI from [here](https://www.soapui.org/).
2. Obtain the WSDL for the target mock service and save your machine.
3. Follow instructions for setting up mock SOAP service [here](https://www.soapui.org/docs/soap-mocking/service-mocking-overview/).
4. Follow instructions [here](https://stackoverflow.com/a/30366762) to export XDS schemas and WSDL.
    - Anything with the .xsd will is a soap schema.
    - There should only be 1 `.wsdl` file per mock service and should be placed in the same directory as the `-config.yaml` file.
    - See the `mock-soap-services/applicants/` for reference.

## Running the mock SOAP services
### Requirements
- Docker must be installed.

### Applicants Mock SOAP API
1. Navigate to `/api` directory.
2. Run the following command
    ```bash
    docker run --rm -ti -p 8082:8080 \
        -v $PWD/mock-soap-services/applicants/:/opt/imposter/config \
        outofcoffee/imposter
    ```
3. Send the following POST request to execute `GetOpportunityList` operation:
    ```bash
    curl -X POST "http://localhost:8082/grantsws-applicant/services/v2/ApplicantWebServicesSoapPort/" \
        -H 'Content-Type: application/soap+xml' \
        -d '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:app="http://apply.grants.gov/services/ApplicantWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0" xmlns:app1="http://apply.grants.gov/system/ApplicantCommonElements-V1.0">
        <soap:Header/>
        <soap:Body>
            <app:GetOpportunityListRequest>
                <!--You have a CHOICE of the next 2 items at this level-->
                <!--Optional:-->
                <gran:PackageID>?</gran:PackageID>
                <!--Optional:-->
                <app1:OpportunityFilter>
                    <!--Optional:-->
                    <gran:FundingOpportunityNumber>?</gran:FundingOpportunityNumber>
                    <!--Optional:-->
                    <gran:CFDANumber>?</gran:CFDANumber>
                    <!--Optional:-->
                    <gran:CompetitionID>?</gran:CompetitionID>
                </app1:OpportunityFilter>
            </app:GetOpportunityListRequest>
        </soap:Body>
        </soap:Envelope>'
    ```
4. You should receive a response similar to the following:
    ```xml
    <?xml version="1.0" encoding="UTF-8"?>
    <env:Envelope xmlns:env="http://schemas.xmlsoap.org/soap/envelope/">
    <env:Header/>
    <env:Body>
        <app:GetOpportunityListResponse xmlns:app="http://apply.grants.gov/services/ApplicantWebServices-V2.0" xmlns:app1="http://apply.grants.gov/system/ApplicantCommonElements-V1.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">
        <app1:OpportunityDetails>
            <gran:FundingOpportunityNumber>string</gran:FundingOpportunityNumber>
            <gran:FundingOpportunityTitle>string</gran:FundingOpportunityTitle>
            <gran:CompetitionID>string</gran:CompetitionID>
            <gran:CompetitionTitle>string</gran:CompetitionTitle>
            <gran:PackageID>string</gran:PackageID>
            <app1:CFDADetails>
            <app1:Number>string</app1:Number>
            <app1:Title>string</app1:Title>
            </app1:CFDADetails>
            <app1:OpeningDate>2014-06-14+00:00</app1:OpeningDate>
            <app1:ClosingDate>2004-12-26</app1:ClosingDate>
            <gran:OfferingAgency>string</gran:OfferingAgency>
            <gran:AgencyContactInfo>string</gran:AgencyContactInfo>
            <gran:SchemaURL>string</gran:SchemaURL>
            <gran:InstructionsURL>string</gran:InstructionsURL>
            <app1:IsMultiProject>true</app1:IsMultiProject>
        </app1:OpportunityDetails>
        </app:GetOpportunityListResponse>
    </env:Body>
    </env:Envelope>
    ```
    - Note: On subsequent requests, you should see certain values that are randomized such as `OpeningDate`.
5. To test the `GetApplicationList` operation send the following request:
    ```bash
    curl -X POST "http://localhost:8082/grantsws-applicant/services/v2/ApplicantWebServicesSoapPort/" \
        -H 'Content-Type: application/soap+xml' \
        -d '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:app="http://apply.grants.gov/services/ApplicantWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">
        <soapenv:Header/>
        <soapenv:Body>
            <app:GetApplicationListRequest>
                <!--Zero or more repetitions:-->
                <gran:ApplicationFilter>
                    <!--Optional:-->
                    <gran:Filter>?</gran:Filter>
                    <!--Optional:-->
                    <gran:FilterValue>?</gran:FilterValue>
                </gran:ApplicationFilter>
            </app:GetApplicationListRequest>
        </soapenv:Body>
   </soapenv:Envelope>'
    ```
