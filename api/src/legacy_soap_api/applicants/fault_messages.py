"""
Fault messages in this file are defined to mirror fault messages from the
existing GG SOAP API. These schemas should only contain fault messages that exist in the
existing system.
"""

from src.legacy_soap_api.legacy_soap_api_schemas import FaultMessage

OpportunityListRequestInvalidParams = FaultMessage(
    faultstring="Unable to Get Opportunity List: At least one filter is required. Filtering by Competition ID requires Opportunity Number and/or CFDA.",
    faultcode="soap:Server",
)
