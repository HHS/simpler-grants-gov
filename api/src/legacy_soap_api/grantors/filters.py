from enum import StrEnum


class GetSubmissionListFilter(StrEnum):
    STATUS = "Status"
    GRANTS_GOV_TRACKING_NUMBER = "GrantsGovTrackingNumber"
    CFDA_NUMBER = "CFDANumber"
    FUNDING_OPPORTUNITY_NUMBER = "FundingOpportunityNumber"
    OPPORTUNITY_ID = "OpportunityID"
    COMPETITION_ID = "CompetitionID"
    PACKAGE_ID = "PackageID"
    SUBMISSION_TITLE = "SubmissionTitle"
