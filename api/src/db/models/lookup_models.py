from sqlalchemy.orm import Mapped, mapped_column

from src.constants.lookup_constants import (
    AgencyDownloadFileType,
    AgencySubmissionNotificationSetting,
    ApplicantType,
    ApplicationStatus,
    CompetitionOpenToApplicant,
    ExternalUserType,
    ExtractType,
    FormFamily,
    FundingCategory,
    FundingInstrument,
    JobStatus,
    OpportunityCategory,
    OpportunityStatus,
    SamGovImportType,
)
from src.db.models.base import TimestampMixin
from src.db.models.lookup import Lookup, LookupConfig, LookupRegistry, LookupStr, LookupTable

OPPORTUNITY_STATUS_CONFIG = LookupConfig(
    [
        LookupStr(OpportunityStatus.FORECASTED, 1),
        LookupStr(OpportunityStatus.POSTED, 2),
        LookupStr(OpportunityStatus.CLOSED, 3),
        LookupStr(OpportunityStatus.ARCHIVED, 4),
    ]
)

OPPORTUNITY_CATEGORY_CONFIG = LookupConfig(
    [
        LookupStr(OpportunityCategory.DISCRETIONARY, 1),
        LookupStr(OpportunityCategory.MANDATORY, 2),
        LookupStr(OpportunityCategory.CONTINUATION, 3),
        LookupStr(OpportunityCategory.EARMARK, 4),
        LookupStr(OpportunityCategory.OTHER, 5),
    ]
)

APPLICANT_TYPE_CONFIG = LookupConfig(
    [
        LookupStr(ApplicantType.STATE_GOVERNMENTS, 1),
        LookupStr(ApplicantType.COUNTY_GOVERNMENTS, 2),
        LookupStr(ApplicantType.CITY_OR_TOWNSHIP_GOVERNMENTS, 3),
        LookupStr(ApplicantType.SPECIAL_DISTRICT_GOVERNMENTS, 4),
        LookupStr(ApplicantType.INDEPENDENT_SCHOOL_DISTRICTS, 5),
        LookupStr(ApplicantType.PUBLIC_AND_STATE_INSTITUTIONS_OF_HIGHER_EDUCATION, 6),
        LookupStr(ApplicantType.PRIVATE_INSTITUTIONS_OF_HIGHER_EDUCATION, 7),
        LookupStr(ApplicantType.FEDERALLY_RECOGNIZED_NATIVE_AMERICAN_TRIBAL_GOVERNMENTS, 8),
        LookupStr(ApplicantType.OTHER_NATIVE_AMERICAN_TRIBAL_ORGANIZATIONS, 9),
        LookupStr(ApplicantType.PUBLIC_AND_INDIAN_HOUSING_AUTHORITIES, 10),
        LookupStr(ApplicantType.NONPROFITS_NON_HIGHER_EDUCATION_WITH_501C3, 11),
        LookupStr(ApplicantType.NONPROFITS_NON_HIGHER_EDUCATION_WITHOUT_501C3, 12),
        LookupStr(ApplicantType.INDIVIDUALS, 13),
        LookupStr(ApplicantType.FOR_PROFIT_ORGANIZATIONS_OTHER_THAN_SMALL_BUSINESSES, 14),
        LookupStr(ApplicantType.SMALL_BUSINESSES, 15),
        LookupStr(ApplicantType.OTHER, 16),
        LookupStr(ApplicantType.UNRESTRICTED, 17),
    ]
)


FUNDING_CATEGORY_CONFIG = LookupConfig(
    [
        LookupStr(FundingCategory.RECOVERY_ACT, 1),
        LookupStr(FundingCategory.AGRICULTURE, 2),
        LookupStr(FundingCategory.ARTS, 3),
        LookupStr(FundingCategory.BUSINESS_AND_COMMERCE, 4),
        LookupStr(FundingCategory.COMMUNITY_DEVELOPMENT, 5),
        LookupStr(FundingCategory.CONSUMER_PROTECTION, 6),
        LookupStr(FundingCategory.DISASTER_PREVENTION_AND_RELIEF, 7),
        LookupStr(FundingCategory.EDUCATION, 8),
        LookupStr(FundingCategory.EMPLOYMENT_LABOR_AND_TRAINING, 9),
        LookupStr(FundingCategory.ENERGY, 10),
        LookupStr(FundingCategory.ENVIRONMENT, 11),
        LookupStr(FundingCategory.FOOD_AND_NUTRITION, 12),
        LookupStr(FundingCategory.HEALTH, 13),
        LookupStr(FundingCategory.HOUSING, 14),
        LookupStr(FundingCategory.HUMANITIES, 15),
        LookupStr(FundingCategory.INFRASTRUCTURE_INVESTMENT_AND_JOBS_ACT, 16),
        LookupStr(FundingCategory.INFORMATION_AND_STATISTICS, 17),
        LookupStr(FundingCategory.INCOME_SECURITY_AND_SOCIAL_SERVICES, 18),
        LookupStr(FundingCategory.LAW_JUSTICE_AND_LEGAL_SERVICES, 19),
        LookupStr(FundingCategory.NATURAL_RESOURCES, 20),
        LookupStr(FundingCategory.OPPORTUNITY_ZONE_BENEFITS, 21),
        LookupStr(FundingCategory.REGIONAL_DEVELOPMENT, 22),
        LookupStr(FundingCategory.SCIENCE_TECHNOLOGY_AND_OTHER_RESEARCH_AND_DEVELOPMENT, 23),
        LookupStr(FundingCategory.TRANSPORTATION, 24),
        LookupStr(FundingCategory.AFFORDABLE_CARE_ACT, 25),
        LookupStr(FundingCategory.OTHER, 26),
    ]
)

FUNDING_INSTRUMENT_CONFIG = LookupConfig(
    [
        LookupStr(FundingInstrument.COOPERATIVE_AGREEMENT, 1),
        LookupStr(FundingInstrument.GRANT, 2),
        LookupStr(FundingInstrument.PROCUREMENT_CONTRACT, 3),
        LookupStr(FundingInstrument.OTHER, 4),
    ]
)

AGENCY_DOWNLOAD_FILE_TYPE_CONFIG = LookupConfig(
    [LookupStr(AgencyDownloadFileType.XML, 1), LookupStr(AgencyDownloadFileType.PDF, 2)]
)

AGENCY_SUBMISSION_NOTIFICATION_SETTING_CONFIG = LookupConfig(
    [
        LookupStr(AgencySubmissionNotificationSetting.NEVER, 1),
        LookupStr(AgencySubmissionNotificationSetting.FIRST_APPLICATION_ONLY, 2),
        LookupStr(AgencySubmissionNotificationSetting.ALWAYS, 3),
    ]
)

JOB_STATUS_CONFIG = LookupConfig(
    [
        LookupStr(JobStatus.STARTED, 1),
        LookupStr(JobStatus.COMPLETED, 2),
        LookupStr(JobStatus.FAILED, 3),
    ]
)

EXTERNAL_USER_TYPE_CONFIG = LookupConfig([LookupStr(ExternalUserType.LOGIN_GOV, 1)])

EXTRACT_TYPE_CONFIG = LookupConfig(
    [
        LookupStr(ExtractType.OPPORTUNITIES_JSON, 1),
        LookupStr(ExtractType.OPPORTUNITIES_CSV, 2),
    ]
)

FORM_FAMILY_CONFIG = LookupConfig(
    [
        LookupStr(FormFamily.SF_424, 1),
        LookupStr(FormFamily.SF_424_INDIVIDUAL, 2),
        LookupStr(FormFamily.RR, 3),
        LookupStr(FormFamily.SF_424_MANDATORY, 4),
        LookupStr(FormFamily.SF_424_SHORT_ORGANIZATION, 5),
    ]
)

COMPETITION_OPEN_TO_APPLICANT_CONFIG = LookupConfig(
    [
        LookupStr(CompetitionOpenToApplicant.INDIVIDUAL, 1),
        LookupStr(CompetitionOpenToApplicant.ORGANIZATION, 2),
    ]
)

SAM_GOV_IMPORT_TYPE_CONFIG = LookupConfig(
    [
        LookupStr(SamGovImportType.MONTHLY_EXTRACT, 1),
        LookupStr(SamGovImportType.DAILY_EXTRACT, 2),
        LookupStr(SamGovImportType.API, 3),
    ]
)

APPLICATION_STATUS_CONFIG = LookupConfig(
    [
        LookupStr(ApplicationStatus.IN_PROGRESS, 1),
        LookupStr(ApplicationStatus.SUBMITTED, 2),
        LookupStr(ApplicationStatus.ACCEPTED, 3),
    ]
)


@LookupRegistry.register_lookup(OPPORTUNITY_CATEGORY_CONFIG)
class LkOpportunityCategory(LookupTable, TimestampMixin):
    __tablename__ = "lk_opportunity_category"

    opportunity_category_id: Mapped[int] = mapped_column(primary_key=True)
    description: Mapped[str]

    @classmethod
    def from_lookup(cls, lookup: Lookup) -> "LkOpportunityCategory":
        return LkOpportunityCategory(
            opportunity_category_id=lookup.lookup_val, description=lookup.get_description()
        )


@LookupRegistry.register_lookup(APPLICANT_TYPE_CONFIG)
class LkApplicantType(LookupTable, TimestampMixin):
    __tablename__ = "lk_applicant_type"

    applicant_type_id: Mapped[int] = mapped_column(primary_key=True)
    description: Mapped[str]

    @classmethod
    def from_lookup(cls, lookup: Lookup) -> "LkApplicantType":
        return LkApplicantType(
            applicant_type_id=lookup.lookup_val, description=lookup.get_description()
        )


@LookupRegistry.register_lookup(FUNDING_CATEGORY_CONFIG)
class LkFundingCategory(LookupTable, TimestampMixin):
    __tablename__ = "lk_funding_category"

    funding_category_id: Mapped[int] = mapped_column(primary_key=True)
    description: Mapped[str]

    @classmethod
    def from_lookup(cls, lookup: Lookup) -> "LkFundingCategory":
        return LkFundingCategory(
            funding_category_id=lookup.lookup_val, description=lookup.get_description()
        )


@LookupRegistry.register_lookup(FUNDING_INSTRUMENT_CONFIG)
class LkFundingInstrument(LookupTable, TimestampMixin):
    __tablename__ = "lk_funding_instrument"

    funding_instrument_id: Mapped[int] = mapped_column(primary_key=True)
    description: Mapped[str]

    @classmethod
    def from_lookup(cls, lookup: Lookup) -> "LkFundingInstrument":
        return LkFundingInstrument(
            funding_instrument_id=lookup.lookup_val, description=lookup.get_description()
        )


@LookupRegistry.register_lookup(OPPORTUNITY_STATUS_CONFIG)
class LkOpportunityStatus(LookupTable, TimestampMixin):
    __tablename__ = "lk_opportunity_status"

    opportunity_status_id: Mapped[int] = mapped_column(primary_key=True)
    description: Mapped[str]

    @classmethod
    def from_lookup(cls, lookup: Lookup) -> "LkOpportunityStatus":
        return LkOpportunityStatus(
            opportunity_status_id=lookup.lookup_val, description=lookup.get_description()
        )


@LookupRegistry.register_lookup(AGENCY_DOWNLOAD_FILE_TYPE_CONFIG)
class LkAgencyDownloadFileType(LookupTable, TimestampMixin):
    __tablename__ = "lk_agency_download_file_type"

    agency_download_file_type_id: Mapped[int] = mapped_column(primary_key=True)
    description: Mapped[str]

    @classmethod
    def from_lookup(cls, lookup: Lookup) -> "LkAgencyDownloadFileType":
        return LkAgencyDownloadFileType(
            agency_download_file_type_id=lookup.lookup_val, description=lookup.get_description()
        )


@LookupRegistry.register_lookup(AGENCY_SUBMISSION_NOTIFICATION_SETTING_CONFIG)
class LkAgencySubmissionNotificationSetting(LookupTable, TimestampMixin):
    __tablename__ = "lk_agency_submission_notification_setting"

    agency_submission_notification_setting_id: Mapped[int] = mapped_column(primary_key=True)
    description: Mapped[str]

    @classmethod
    def from_lookup(cls, lookup: Lookup) -> "LkAgencySubmissionNotificationSetting":
        return LkAgencySubmissionNotificationSetting(
            agency_submission_notification_setting_id=lookup.lookup_val,
            description=lookup.get_description(),
        )


@LookupRegistry.register_lookup(EXTERNAL_USER_TYPE_CONFIG)
class LkExternalUserType(LookupTable, TimestampMixin):
    __tablename__ = "lk_external_user_type"

    external_user_type_id: Mapped[int] = mapped_column(primary_key=True)
    description: Mapped[str]

    @classmethod
    def from_lookup(cls, lookup: Lookup) -> "LkExternalUserType":
        return LkExternalUserType(
            external_user_type_id=lookup.lookup_val, description=lookup.get_description()
        )


@LookupRegistry.register_lookup(EXTRACT_TYPE_CONFIG)
class LkExtractType(LookupTable, TimestampMixin):
    __tablename__ = "lk_extract_type"

    extract_type_id: Mapped[int] = mapped_column(primary_key=True)
    description: Mapped[str]

    @classmethod
    def from_lookup(cls, lookup: Lookup) -> "LkExtractType":
        return LkExtractType(
            extract_type_id=lookup.lookup_val, description=lookup.get_description()
        )


@LookupRegistry.register_lookup(JOB_STATUS_CONFIG)
class LkJobStatus(LookupTable, TimestampMixin):
    __tablename__ = "lk_job_status"

    job_status_id: Mapped[int] = mapped_column(primary_key=True)
    description: Mapped[str]

    @classmethod
    def from_lookup(cls, lookup: Lookup) -> "LkJobStatus":
        return LkJobStatus(job_status_id=lookup.lookup_val, description=lookup.get_description())


@LookupRegistry.register_lookup(FORM_FAMILY_CONFIG)
class LkFormFamily(LookupTable, TimestampMixin):
    __tablename__ = "lk_form_family"

    form_family_id: Mapped[int] = mapped_column(primary_key=True)
    description: Mapped[str]

    @classmethod
    def from_lookup(cls, lookup: Lookup) -> "LkFormFamily":
        return LkFormFamily(form_family_id=lookup.lookup_val, description=lookup.get_description())


@LookupRegistry.register_lookup(COMPETITION_OPEN_TO_APPLICANT_CONFIG)
class LkCompetitionOpenToApplicant(LookupTable, TimestampMixin):
    __tablename__ = "lk_competition_open_to_applicant"

    competition_open_to_applicant_id: Mapped[int] = mapped_column(primary_key=True)
    description: Mapped[str]

    @classmethod
    def from_lookup(cls, lookup: Lookup) -> "LkCompetitionOpenToApplicant":
        return LkCompetitionOpenToApplicant(
            competition_open_to_applicant_id=lookup.lookup_val, description=lookup.get_description()
        )


@LookupRegistry.register_lookup(SAM_GOV_IMPORT_TYPE_CONFIG)
class LkSamGovImportType(LookupTable, TimestampMixin):
    __tablename__ = "lk_sam_gov_import_type"

    sam_gov_import_type_id: Mapped[int] = mapped_column(primary_key=True)
    description: Mapped[str]

    @classmethod
    def from_lookup(cls, lookup: Lookup) -> "LkSamGovImportType":
        return LkSamGovImportType(
            sam_gov_import_type_id=lookup.lookup_val, description=lookup.get_description()
        )


@LookupRegistry.register_lookup(APPLICATION_STATUS_CONFIG)
class LkApplicationStatus(LookupTable, TimestampMixin):
    __tablename__ = "lk_application_status"

    application_status_id: Mapped[int] = mapped_column(primary_key=True)
    description: Mapped[str]

    @classmethod
    def from_lookup(cls, lookup: Lookup) -> "LkApplicationStatus":
        return LkApplicationStatus(
            application_status_id=lookup.lookup_val, description=lookup.get_description()
        )
