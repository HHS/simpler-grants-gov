# SOAP Notary

The SOAP Notary is Simpler Grants.gov's solution to continuing to support Agencies who have integrated with Grants.gov via the S2S SOAP interface, while also allowing the modernized system to innovate and improve the experience without being overly tied to providing backward compatibility.

## Audience

The primary audience for the SOAP Notary is Agencies who retrieve Application data from Grants.gov either directly into their own systems, or by utilizing GrantsSolutions. The SOAP Notary will provide a mechanism for that Application data to continue flowing through existing integrations while Simpler Grants works to iterate and evolve the Application experience for Applicants and Grantors. By providing the SOAP Notary, that backwards compatibility layer and unification of data between the existing Grants.gov and Simpler Grants.gov systems is done in one place, via one focused investment in maintaining those integrations.

## Behaviors

The SOAP Notary supports multiple different behaviors when receiving SOAP requests that can be configured based on the SOAP method being requested, the caller, or the agency that the Grant Opportunity or Application is associated with. This provides the ability to evolve the systems behind the Notary layer, including depreciation and end of life of existing systems and infrastructure to be disconnected from the timelines of backwards compatibility and ongoing support of SOAP consumers.

### Default Behavior

The default behavior of the SOAP Notary is to forward any SOAP request to the existing S2S SOAP API for handling. The response from the existing API will be returned to the caller.

### Blended Behavior

A second style of SOAP Notary behavior is to combine data from both the existing S2S SOAP API and the new Simpler system to create a single result set. This provides a backwards compatible, drop in substitute that will allow callers to interact with both Simpler Grants and Grants.gov with a single URL change.

### Cut Over Behavior

A third style of SOAP Notary behavior is to stop pulling data from the S2S SOAP API and only serve data from Simpler Grants, while maintaining the SOAP interface.

## Migration away from SOAP

### Long Term Road Map

As Simpler Grants stabilizes and support for features and application forms reaches saturation with the needs of Grantors and Applicants, we will set an end-of-life timeline for the SOAP interface. But existing SOAP API consumers can move to the REST API provided by Simpler Grants (and in some cases CommonGrants) on their own timeline prior to those cut offs.

### Migration Path

While there is not a commitment to 1-to-1 replacement/compatibility between existing SOAP requests and the new REST interface, this table provides a rough mapping for existing SOAP implementations to determine which REST endpoints would play a similar role in a REST implementation. REST implementation represents a mixture of native Simpler Grants API endpoints and CommonGrants Standard endpoints. Both types of endpoints are available the single API hosted on api.simpler.grants.gov, api.training.simpler.grants.gov, etc.

#### [Grantor](https://www.grants.gov/system-to-system/grantor-system-to-system/web-services/)

| SOAP Endpoint                                                                                                                                                                                                                                                             | REST Endpoint                                                                                                                            | Notes                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [GetSubmissionListExpanded](https://www.grants.gov/system-to-system/grantor-system-to-system/web-services/get-submission-list-expanded)                                                                                                                                   | [/common-grants/applications/search](https://commongrants.org/protocol/api-docs/?version=0.3.0)                                          | _Proposed_ Not yet implemented                                                                                                                                                                                                                        |
| [GetApplication](https://www.grants.gov/system-to-system/grantor-system-to-system/web-services/get-application)                                                                                                                                                           | [/alpha/applications/{application_id}](https://api.simpler.grants.gov/docs#/Application%20Alpha/get_alpha_applications__application_id_) |                                                                                                                                                                                                                                                       |
| [GetApplicationZip](https://www.grants.gov/system-to-system/grantor-system-to-system/web-services/get-application-zip)                                                                                                                                                    | [/alpha/applications/{application_id}](https://api.simpler.grants.gov/docs#/Application%20Alpha/get_alpha_applications__application_id_) | One of the properties returned from this endpoint is a time-limited link to download the Zip file. The Zip file will contain the same backwards compatible XML file, attachments, and a new JSON file that mirrors the data returned by this endpoint |
| [ConfirmApplicationDelivery](https://www.grants.gov/system-to-system/grantor-system-to-system/web-services/confirm-application-delivery) / [UpdateApplicationInfo](https://www.grants.gov/system-to-system/grantor-system-to-system/web-services/update-application-info) | TBD                                                                                                                                      | It's anticipated both the functionality of these endpoints will be combined into a single endpoint that allows updating the state of an Application and assigning an Agency tracking number                                                           |

#### Applicant
