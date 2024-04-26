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
