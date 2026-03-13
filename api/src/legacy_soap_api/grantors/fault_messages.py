from src.legacy_soap_api.legacy_soap_api_schemas import FaultMessage

InvalidGrantsGovTrackingNumber = FaultMessage(
    faultstring="Failed to validate request. cvc-pattern-valid: Value is not facet-valid with respect to pattern 'GRANT[0-9]{8}' for type 'GrantsGovTrackingNumberType'.",
    faultcode="soap:Server",
)

MissingGrantsGovTrackingNumber = FaultMessage(
    faultstring="Failed to validate request.\ncvc-complex-type.2.4.b: The content of element UpdateApplicationInfoRequest is not complete. One of {https://apply.grants.gov/system/GrantsCommonElements-V1.0:GrantsGovTrackingNumber} is expected.",
    faultcode="soap:Server",
)
