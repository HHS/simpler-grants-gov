from enum import StrEnum


class OpportunityStatus(StrEnum):
    FORECASTED = "forecasted"
    POSTED = "posted"
    CLOSED = "closed"
    ARCHIVED = "archived"


class OpportunityCategoryLegacy(StrEnum):
    # These are only used where the legacy system
    # needs to specify the values and can be removed
    # when our v0 endpoint is removed
    DISCRETIONARY = "D"
    MANDATORY = "M"
    CONTINUATION = "C"
    EARMARK = "E"
    OTHER = "O"


class OpportunityCategory(StrEnum):
    DISCRETIONARY = "discretionary"
    MANDATORY = "mandatory"
    CONTINUATION = "continuation"
    EARMARK = "earmark"
    OTHER = "other"


class ApplicantType(StrEnum):
    # https://grants.gov/system-to-system/grantor-system-to-system/schemas/grants-funding-synopsis#EligibleApplicantTypes
    # Comment is the legacy systems code

    STATE_GOVERNMENTS = "state_governments"  # 00
    COUNTY_GOVERNMENTS = "county_governments"  # 01
    CITY_OR_TOWNSHIP_GOVERNMENTS = "city_or_township_governments"  # 02
    SPECIAL_DISTRICT_GOVERNMENTS = "special_district_governments"  # 04

    INDEPENDENT_SCHOOL_DISTRICTS = "independent_school_districts"  # 05
    PUBLIC_AND_STATE_INSTITUTIONS_OF_HIGHER_EDUCATION = (
        "public_and_state_institutions_of_higher_education"  # 06
    )
    PRIVATE_INSTITUTIONS_OF_HIGHER_EDUCATION = "private_institutions_of_higher_education"  # 20

    FEDERALLY_RECOGNIZED_NATIVE_AMERICAN_TRIBAL_GOVERNMENTS = (
        "federally_recognized_native_american_tribal_governments"  # 07
    )
    # This was previously "Native American tribal organizations other than Federally recognized tribal governments"
    OTHER_NATIVE_AMERICAN_TRIBAL_ORGANIZATIONS = "other_native_american_tribal_organizations"  # 11
    PUBLIC_AND_INDIAN_HOUSING_AUTHORITIES = "public_and_indian_housing_authorities"  # 08

    NONPROFITS_NON_HIGHER_EDUCATION_WITH_501C3 = "nonprofits_non_higher_education_with_501c3"  # 12
    NONPROFITS_NON_HIGHER_EDUCATION_WITHOUT_501C3 = (
        "nonprofits_non_higher_education_without_501c3"  # 13
    )

    INDIVIDUALS = "individuals"  # 21
    FOR_PROFIT_ORGANIZATIONS_OTHER_THAN_SMALL_BUSINESSES = (
        "for_profit_organizations_other_than_small_businesses"  # 22
    )
    SMALL_BUSINESSES = "small_businesses"  # 23
    OTHER = "other"  # 25
    UNRESTRICTED = "unrestricted"  # 99


class FundingCategory(StrEnum):
    # https://grants.gov/system-to-system/grantor-system-to-system/schemas/grants-funding-synopsis#FundingActivityCategory
    # Comment is the legacy systems code

    RECOVERY_ACT = "recovery_act"  # RA
    AGRICULTURE = "agriculture"  # AG
    ARTS = "arts"  # AR
    BUSINESS_AND_COMMERCE = "business_and_commerce"  # BC
    COMMUNITY_DEVELOPMENT = "community_development"  # CD
    CONSUMER_PROTECTION = "consumer_protection"  # CP
    DISASTER_PREVENTION_AND_RELIEF = "disaster_prevention_and_relief"  # DPR
    EDUCATION = "education"  # ED
    EMPLOYMENT_LABOR_AND_TRAINING = "employment_labor_and_training"  # ELT
    ENERGY = "energy"  # EN
    ENVIRONMENT = "environment"  # ENV
    FOOD_AND_NUTRITION = "food_and_nutrition"  # FN
    HEALTH = "health"  # HL
    HOUSING = "housing"  # HO
    HUMANITIES = "humanities"  # HU
    INFRASTRUCTURE_INVESTMENT_AND_JOBS_ACT = "infrastructure_investment_and_jobs_act"  # IIJ
    INFORMATION_AND_STATISTICS = "information_and_statistics"  # IS
    INCOME_SECURITY_AND_SOCIAL_SERVICES = "income_security_and_social_services"  # ISS
    LAW_JUSTICE_AND_LEGAL_SERVICES = "law_justice_and_legal_services"  # LJL
    NATURAL_RESOURCES = "natural_resources"  # NR
    OPPORTUNITY_ZONE_BENEFITS = "opportunity_zone_benefits"  # OZ
    REGIONAL_DEVELOPMENT = "regional_development"  # RD
    SCIENCE_TECHNOLOGY_AND_OTHER_RESEARCH_AND_DEVELOPMENT = (
        "science_technology_and_other_research_and_development"  # ST
    )
    TRANSPORTATION = "transportation"  # T
    AFFORDABLE_CARE_ACT = "affordable_care_act"  # ACA
    OTHER = "other"  # O


class FundingInstrument(StrEnum):
    # https://grants.gov/system-to-system/grantor-system-to-system/schemas/grants-funding-synopsis#FundingInstrument
    # Comment is the legacy systems code

    COOPERATIVE_AGREEMENT = "cooperative_agreement"  # CA
    GRANT = "grant"  # G
    PROCUREMENT_CONTRACT = "procurement_contract"  # PC
    OTHER = "other"  # O


class AgencyDownloadFileType(StrEnum):
    XML = "xml"
    PDF = "pdf"


class AgencySubmissionNotificationSetting(StrEnum):
    NEVER = "never"
    FIRST_APPLICATION_ONLY = "first_application_only"
    ALWAYS = "always"


class ExtractType(StrEnum):
    OPPORTUNITIES_JSON = "opportunities_json"
    OPPORTUNITIES_CSV = "opportunities_csv"


class ExternalUserType(StrEnum):
    LOGIN_GOV = "login_gov"


class JobStatus(StrEnum):
    STARTED = "started"
    COMPLETED = "completed"
    FAILED = "failed"


class FormFamily(StrEnum):
    SF_424 = "sf-424"
    SF_424_INDIVIDUAL = "sf-424-individual"
    RR = "r&r"
    SF_424_MANDATORY = "sf-424-mandatory"
    SF_424_SHORT_ORGANIZATION = "sf-424-short-organization"


class FormType(StrEnum):
    SF424 = "SF424"
    SF424A = "SF424A"
    SF424B = "SF424B"
    SF424D = "SF424D"
    SFLLL = "SFLLL"
    PROJECT_NARRATIVE_ATTACHMENT = "ProjectNarrativeAttachment"
    BUDGET_NARRATIVE_ATTACHMENT = "BudgetNarrativeAttachment"
    OTHER_NARRATIVE_ATTACHMENT = "OtherNarrativeAttachment"
    PROJECT_ABSTRACT_SUMMARY = "ProjectAbstractSummary"
    PROJECT_ABSTRACT = "ProjectAbstract"
    CD511 = "CD511"

    SUPPLEMENTARY_NEH_COVER_SHEET = "SupplementaryNEHCoverSheet"

    GG_LOBBYING_FORM = "GGLobbyingForm"

    EPA_FORM_4700_4 = "EPAForm4700-4"
    EPA_KEY_CONTACTS = "EPAKeyContacts"


class CompetitionOpenToApplicant(StrEnum):
    INDIVIDUAL = "individual"
    ORGANIZATION = "organization"


class SubmissionIssue(StrEnum):
    """Submission issue types for metrics logging"""

    NOT_A_MEMBER_OF_ORG = "not_a_member_of_org"
    ORG_NO_SAM_GOV_ENTITY = "org_no_sam_gov_entity"
    ORG_INACTIVE_IN_SAM_GOV = "org_inactive_in_sam_gov"
    ORG_SAM_GOV_EXPIRED = "org_sam_gov_expired"
    COMPETITION_NO_ORG_APPLICATIONS = "competition_no_org_applications"
    COMPETITION_NO_INDIVIDUAL_APPLICATIONS = "competition_no_individual_applications"
    COMPETITION_NOT_FOUND = "competition_not_found"
    ORGANIZATION_NOT_FOUND = "organization_not_found"
    APPLICATION_NOT_IN_PROGRESS = "application_not_in_progress"
    COMPETITION_NOT_OPEN = "competition_not_open"
    FORM_VALIDATION_ERRORS = "form_validation_errors"
    UNAUTHORIZED_APPLICATION_ACCESS = "unauthorized_application_access"
    NO_UPDATE_DATA_PROVIDED = "no_update_data_provided"
    FORM_NOT_FOUND_OR_NOT_ATTACHED = "form_not_found_or_not_attached"
    APPLICATION_FORM_NOT_FOUND_NO_RESPONSE = "application_form_not_found_no_response"
    INVALID_FILE_NAME = "invalid_file_name"
    ATTACHMENT_NOT_FOUND = "attachment_not_found"


class SamGovExtractType(StrEnum):
    MONTHLY = "monthly"
    DAILY = "daily"


class SamGovProcessingStatus(StrEnum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    DELETED = "deleted"


class SamGovImportType(StrEnum):
    MONTHLY_EXTRACT = "monthly_extract"
    DAILY_EXTRACT = "daily_extract"
    API = "api"


class ApplicationStatus(StrEnum):
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    ACCEPTED = "accepted"


class ApplicationFormStatus(StrEnum):
    IN_PROGRESS = "in_progress"
    COMPLETE = "complete"


class Privilege(StrEnum):
    MANAGE_ORG_MEMBERS = "manage_org_members"
    MANAGE_ORG_ADMIN_MEMBERS = "manage_org_admin_members"
    VIEW_ORG_MEMBERSHIP = "view_org_membership"
    START_APPLICATION = "start_application"
    LIST_APPLICATION = "list_application"
    VIEW_APPLICATION = "view_application"
    MODIFY_APPLICATION = "modify_application"
    SUBMIT_APPLICATION = "submit_application"
    UPDATE_FORM = "update_form"
    MANAGE_AGENCY_MEMBERS = "manage_agency_members"
    GET_SUBMITTED_APPLICATIONS = "get_submitted_applications"
    LEGACY_AGENCY_VIEWER = "legacy_agency_viewer"
    LEGACY_AGENCY_GRANT_RETRIEVER = "legacy_agency_grant_retriever"
    LEGACY_AGENCY_ASSIGNER = "legacy_agency_assigner"


class RoleType(StrEnum):
    ORGANIZATION = "organization"
    AGENCY = "agency"
    INTERNAL = "internal"
    APPLICATION = "application"


class OrganizationInvitationStatus(StrEnum):
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    EXPIRED = "expired"
    PENDING = "pending"


class LegacyUserStatus(StrEnum):
    MEMBER = "member"
    PENDING_INVITATION = "pending_invitation"
    AVAILABLE = "available"


class LegacyProfileType(StrEnum):
    """Legacy Oracle profile types from tuser_profile table"""

    ORGANIZATION_APPLICANT = "4"


class ApplicationAuditEvent(StrEnum):
    APPLICATION_CREATED = "application_created"
    APPLICATION_NAME_CHANGED = "application_name_changed"
    APPLICATION_SUBMITTED = "application_submitted"
    APPLICATION_SUBMIT_REJECTED = "application_submit_rejected"
    ATTACHMENT_ADDED = "attachment_added"
    ATTACHMENT_DELETED = "attachment_deleted"
    ATTACHMENT_UPDATED = "attachment_updated"
    SUBMISSION_CREATED = "submission_created"
    USER_ADDED = "user_added"
    USER_UPDATED = "user_updated"
    USER_REMOVED = "user_removed"
    FORM_UPDATED = "form_updated"
    ORGANIZATION_ADDED = "organization_added"


class CommonGrantsEvent(StrEnum):

    URL_VALIDATION_ERROR = "url_validation_error"
    OPPORTUNITY_VALIDATION_ERROR = "opportunity_validation_error"


class UserType(StrEnum):
    STANDARD = "standard"
    INTERNAL_FRONTEND = "internal_frontend"
    LEGACY_CERTIFICATE = "legacy_certificate"
