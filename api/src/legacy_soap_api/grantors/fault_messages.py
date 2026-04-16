from src.legacy_soap_api.legacy_soap_api_schemas import FaultMessage

InvalidGrantsGovTrackingNumber = FaultMessage(
    faultstring="Failed to validate request. cvc-pattern-valid: Value is not facet-valid with respect to pattern 'GRANT[0-9]{8}' for type 'GrantsGovTrackingNumberType'.",
    faultcode="soap:Server",
)

MissingGrantsGovTrackingNumber = FaultMessage(
    faultstring="Failed to validate request.\ncvc-complex-type.2.4.b: The content of element UpdateApplicationInfoRequest is not complete. One of {https://apply.grants.gov/system/GrantsCommonElements-V1.0:GrantsGovTrackingNumber} is expected.",
    faultcode="soap:Server",
)

ConfirmDeliverySubmissionNotFound = FaultMessage(
    faultstring="Unable to find application from tracking number. Failed to confirm application delivery.",
    faultcode="soap:Server",
)

ConfirmDeliveryAlreadyRetrieved = FaultMessage(
    faultstring="This application submission has already been retrieved. Failed to confirm application delivery.",
    faultcode="soap:Server",
)

UpdateApplicationInfoSubmissionNotFound = FaultMessage(
    faultstring="Unable to find application from tracking number. Failed to update application info.",
    faultcode="soap:Server",
)

UpdateApplicationInfoInvalidStatus = FaultMessage(
    faultstring="Invalid application status. Failed to update application info.",
    faultcode="soap:Server",
)

UpdateApplicationInfoTrackingNumberAlreadyAssigned = FaultMessage(
    faultstring="Agency tracking number has already been assigned. Failed to update application info.",
    faultcode="soap:Server",
)
