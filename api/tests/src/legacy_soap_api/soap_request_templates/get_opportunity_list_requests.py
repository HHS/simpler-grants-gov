def get_envelope(envelope_body: str) -> str:
    return f"""
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:app="http://apply.grants.gov/services/ApplicantWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0" xmlns:app1="http://apply.grants.gov/system/ApplicantCommonElements-V1.0">
   <soapenv:Header/>
   <soapenv:Body>
        {envelope_body}
   </soapenv:Body>
</soapenv:Envelope>
"""


def get_opportunity_list_by_package_id_request(package_id: str) -> str:
    return get_envelope(
        f"""
<app:GetOpportunityListRequest>
    <gran:PackageID>{package_id}</gran:PackageID>
</app:GetOpportunityListRequest>
"""
    )


def get_opportunity_list_by_competition_id_and_opportunity_number_request(
    competition_id: str, opportunity_number: str
) -> str:
    return get_envelope(
        f"""
<app:GetOpportunityListRequest>
    <app1:OpportunityFilter>
        <gran:CompetitionID>{competition_id}</gran:CompetitionID>
        <gran:FundingOpportunityNumber>{opportunity_number}</gran:FundingOpportunityNumber>
    </app1:OpportunityFilter>
</app:GetOpportunityListRequest>
"""
    )


def get_opportunity_list_by_competition_id_and_assistance_listing_number_request(
    competition_id: str, competition_assistance_listing_number: str
) -> str:
    return get_envelope(
        f"""
<app:GetOpportunityListRequest>
    <app1:OpportunityFilter>
        <gran:CompetitionID>{competition_id}</gran:CompetitionID>
        <gran:CFDANumber>{competition_assistance_listing_number}</gran:CFDANumber>
    </app1:OpportunityFilter>
</app:GetOpportunityListRequest>
"""
    )


def get_opportunity_list_by_opportunity_number_request(opportunity_number: str) -> str:
    return get_envelope(
        f"""
<app:GetOpportunityListRequest>
    <app1:OpportunityFilter>
        <gran:FundingOpportunityNumber>{opportunity_number}</gran:FundingOpportunityNumber>
    </app1:OpportunityFilter>
</app:GetOpportunityListRequest>
"""
    )


def get_opportunity_list_by_assistance_listing_number(
    competition_assistance_listing_number: str,
) -> str:
    return get_envelope(
        f"""
<app:GetOpportunityListRequest>
    <app1:OpportunityFilter>
        <gran:CFDANumber>{competition_assistance_listing_number}</gran:CFDANumber>
    </app1:OpportunityFilter>
</app:GetOpportunityListRequest>
"""
    )


def get_opportunity_list_invalid_opportunity_filter() -> str:
    # Invalid since you need to supply cfda_number or opportunity_number if
    # you provide a competition_id.
    return get_envelope(
        """
<app:GetOpportunityListRequest>
    <app1:OpportunityFilter>
        <gran:CompetitionID>HDTRA1-25-S-0001</gran:CompetitionID>
    </app1:OpportunityFilter>
</app:GetOpportunityListRequest>
"""
    )
