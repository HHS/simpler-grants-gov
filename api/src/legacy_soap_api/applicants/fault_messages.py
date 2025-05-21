from src.legacy_soap_api.legacy_soap_api_schemas import FaultMessage

OpportunityListRequestInvalidParams = FaultMessage(
    faultstring="Unable to Get Opportunity List: At least one filter is required. Filtering by Competition ID requires Opportunity Number and/or CFDA.",
    faultcode="soap:Server",
)
