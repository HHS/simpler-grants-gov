def get_mock_update_application_info_request_xml(
    grants_gov_tracking_number: str = "",
    save_agency_notes: str = "",
    assign_agency_tracking_number: str = "",
):
    if grants_gov_tracking_number:
        grants_gov_tracking_number = f"<gran:GrantsGovTrackingNumber>{grants_gov_tracking_number}</gran:GrantsGovTrackingNumber>"
    if save_agency_notes:
        save_agency_notes = f"<agen1:SaveAgencyNotes>{save_agency_notes}</agen1:SaveAgencyNotes>"
    if assign_agency_tracking_number:
        assign_agency_tracking_number = f"<agen1:AssignAgencyTrackingNumber>{assign_agency_tracking_number}</agen1:AssignAgencyTrackingNumber>"

    return f"""
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
    xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0"
    xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0"
    xmlns:agen1="http://apply.grants.gov/system/AgencyUpdateApplicationInfo-V1.0">
    <soapenv:Header/>
    <soapenv:Body>
        <agen:UpdateApplicationInfoRequest>
            {grants_gov_tracking_number}
            {assign_agency_tracking_number}
            {save_agency_notes}
        </agen:UpdateApplicationInfoRequest>
    </soapenv:Body>
</soapenv:Envelope>
"""


def get_mock_update_application_info_response_xml(grants_gov_tracking_number: str = "") -> str:
    if grants_gov_tracking_number:
        grants_gov_tracking_number = (
            f"<GrantsGovTrackingNumber>{grants_gov_tracking_number}</GrantsGovTrackingNumber>"
        )
    return f"""
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body>
        <ns2:UpdateApplicationInfoResponse xmlns:ns12="http://schemas.xmlsoap.org/wsdl/soap/"
            xmlns:ns11="http://schemas.xmlsoap.org/wsdl/"
            xmlns:ns10="http://apply.grants.gov/system/GrantsFundingSynopsis-V2.0"
            xmlns:ns9="http://apply.grants.gov/system/AgencyUpdateApplicationInfo-V1.0"
            xmlns:ns8="http://apply.grants.gov/system/GrantsForecastSynopsis-V1.0"
            xmlns:ns7="http://apply.grants.gov/system/AgencyManagePackage-V1.0"
            xmlns:ns6="http://apply.grants.gov/system/GrantsPackage-V1.0"
            xmlns:ns5="http://apply.grants.gov/system/GrantsOpportunity-V1.0"
            xmlns:ns4="http://apply.grants.gov/system/GrantsRelatedDocument-V1.0"
            xmlns:ns3="http://apply.grants.gov/system/GrantsTemplate-V1.0"
            xmlns:ns2="http://apply.grants.gov/services/AgencyWebServices-V2.0"
            xmlns="http://apply.grants.gov/system/GrantsCommonElements-V1.0">
            {grants_gov_tracking_number}
            <ns2:Success>true</ns2:Success>
            <ns9:AssignAgencyTrackingNumberResult>
                <ns9:Success>true</ns9:Success>
            </ns9:AssignAgencyTrackingNumberResult>
            <ns9:SaveAgencyNotesResult>
                <ns9:Success>true</ns9:Success>
            </ns9:SaveAgencyNotesResult>
        </ns2:UpdateApplicationInfoResponse>
    </soap:Body>
</soap:Envelope>
    """
