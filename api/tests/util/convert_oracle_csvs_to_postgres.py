######################################################################
# This is a very temporary script for the purposes of creating
# CSV files that we can import into our database.
# It takes CSV extract files from the existing Oracle database
# does a small bit of transformation and produces more CSV extracts
# that we can import into our Postgres database.
#
# This will be replaced by an actual transformation process, but exists
# at this time to aid in speeding up testing by manually doing some of
# the transformation work we will later build out
######################################################################

import logging
import src.logging
import csv


logger = logging.getLogger(__name__)

# TODO - make this an input param of some sort
FOLDER = "/Users/michaelchouinard/workspace/grants-test-db/prod_feb29"

EXPECTED_SUFFIX = "_DATA_TABLE.csv"

summary_id = 0

def convert_legacy_category(value: str | None) -> int | None:
    if value is None or value == "":
        return None

    match value:
        case "D":
            return 1
        case "M":
            return 2
        case "C":
            return 3
        case "E":
            return 4
        case "O":
            return 5

    raise Exception("Unrecognized category %s" % value)


def convert_legacy_funding_instrument_type(value: str | None) -> int | None:
    if value is None or value == "":
        return None

    match value:
        case "CA": # cooperative_agreement
            return 1
        case "G": # grant
            return 2
        case "PC": # procurement_contract
            return 3
        case "O": # other
            return 4

    raise Exception("Unrecognized funding instrument %s" % value)

def convert_legacy_funding_category_type(value: str | None) -> int | None:
    if value is None or value == "":
        return None

    match value:
        case "RA": # recovery_act
            return 1
        case "AG": # agriculture
            return 2
        case "AR": # arts
            return 3
        case "BC": # business_and_commerce
            return 4
        case "CD": # community_development
            return 5
        case "CP": # consumer_protection
            return 6
        case "DPR": # disaster_prevention_and_relief
            return 7
        case "ED": # education
            return 8
        case "ELT": # employment_labor_and_training
            return 9
        case "EN": # energy
            return 10
        case "ENV": # environment
            return 11
        case "FN": # food_and_nutrition
            return 12
        case "HL": # health
            return 13
        case "HO": # housing
            return 14
        case "HU": # humanities
            return 15
        case "IIJ": # infrastructure_investment_and_jobs_act
            return 16
        case "IS": # information_and_statistics
            return 17
        case "ISS": # income_security_and_social_services
            return 18
        case "LJL": # law_justice_and_legal_services
            return 19
        case "NR": # natural_resources
            return 20
        case "OZ": # opportunity_zone_benefits
            return 21
        case "RD": # regional_development
            return 22
        case "ST": # science_technology_and_other_research_and_development
            return 23
        case "T": # transportation
            return 24
        case "ACA": # affordable_care_act
            return 25
        case "O": # other
            return 26

    raise Exception("Unrecognized funding category %s" % value)

def convert_legacy_applicant_type(value: str | None) -> int | None:
    if value is None or value == "":
        return None

    match value:
        case "00": # state_governments
            return 1
        case "01": # county_governments
            return 2
        case "02": # city_or_township_governments
            return 3
        case "04": # special_district_governments
            return 4
        case "05": # independent_school_districts
            return 5
        case "06": # public_and_state_institutions_of_higher_education
            return 6
        case "07": # federally_recognized_native_american_tribal_governments
            return 8
        case "08": # public_and_indian_housing_authorities
            return 10
        case "11": # other_native_american_tribal_organizations
            return 9
        case "12": # nonprofits_non_higher_education_with_501c3
            return 11
        case "13": # nonprofits_non_higher_education_without_501c3
            return 12
        case "20": # private_institutions_of_higher_education
            return 7
        case "21": # individuals
            return 13
        case "22": # for_profit_organizations_other_than_small_businesses
            return 14
        case "23": # small_businesses
            return 15
        case "25": # other
            return 16
        case "99": # unrestricted
            return 17

    raise Exception("Unrecognized applicant type: %s" % value)

def convert_numeric(value: str | None) -> int | None:
    if value is None or value == "":
        return None

    if value.isnumeric():
        return int(value)

    # Anything else is just "none" or "not available" which we'll treat as null
    return None


def convert_yn_bool(value: str | None) -> bool | None:
    if value is None or value == "":
        return None

    if value == "Y":
        return True

    if value == "N":
        return False

    raise Exception("Unexpected Y/N bool value: %s" % value)

def get_csv_records(table_name: str) -> list[dict[str, str]]:
    records = []
    with open(f"{FOLDER}/{table_name}{EXPECTED_SUFFIX}") as infile:
        reader = csv.DictReader(infile)

        for record in reader:
            records.append(record)

    return records


def write_csv(table_name: str, records: list[dict[str, str]]) -> None:
    with open(table_name + ".csv", "w") as outfile:
        writer = csv.DictWriter(outfile, fieldnames=records[0].keys(), quoting=csv.QUOTE_ALL)
        writer.writeheader()
        writer.writerows(records)

def transform_opportunity(record: dict[str, str]) -> dict[str, str]:
    return {
        "opportunity_id": record["OPPORTUNITY_ID"],
        "opportunity_number": record["OPPNUMBER"],
        "opportunity_title": record["OPPTITLE"],
        "agency": record["OWNINGAGENCY"],
        "opportunity_category_id": convert_legacy_category(record["OPPCATEGORY"]),
        "category_explanation": record["CATEGORY_EXPLANATION"],
        "is_draft": record["IS_DRAFT"] != "N",
        "revision_number": record["REVISION_NUMBER"],
        "modified_comments": record["MODIFIED_COMMENTS"],
        "publisher_user_id": record["PUBLISHERUID"],
        "publisher_profile_id": record["PUBLISHER_PROFILE_ID"],
    }

def transform_forecast(record: dict[str, str]) -> dict[str, str]:
    global summary_id
    summary_id += 1

    return {
        "opportunity_summary_id": summary_id,
        "opportunity_id": record.get("OPPORTUNITY_ID"),
        "summary_description": record.get("FORECAST_DESC"),
        "is_cost_sharing": convert_yn_bool(record.get("COST_SHARING")),
        "is_forecast": True,
        "post_date": record.get("POSTING_DATE"),
        "close_date": None,
        "close_date_description": None,
        "archive_date": record.get("ARCHIVE_DATE"),
        "unarchive_date": record.get("UNARCHIVE_DATE"),
        "expected_number_of_awards": convert_numeric(record.get("NUMBER_OF_AWARDS")),
        "estimated_total_program_funding": convert_numeric(record.get("EST_FUNDING")),
        "award_floor": convert_numeric(record.get("AWARD_FLOOR")),
        "award_ceiling": convert_numeric(record.get("AWARD_CEILING")),
        "additional_info_url": record.get("FD_LINK_URL"),
        "additional_info_url_description": record.get("FD_LINK_DESC"),
        "forecasted_post_date": record.get("EST_SYNOPSIS_POSTING_DATE"),
        "forecasted_close_date": record.get("EST_APPL_RESPONSE_DATE"),
        "forecasted_close_date_description": record.get("EST_APPL_RESPONSE_DATE_DESC"),
        "forecasted_award_date": record.get("EST_AWARD_DATE"),
        "forecasted_project_start_date": record.get("EST_PROJECT_START_DATE"),
        "fiscal_year": record.get("FISCAL_YEAR"),
        "revision_number": None,
        "modification_comments": record.get("MODIFICATION_COMMENTS"),
        "funding_category_description": record.get("OTH_CAT_FA_DESC"),
        "agency_code": record.get("AGENCY_CODE"),
        "agency_name": record.get("AC_NAME"),
        "agency_phone_number": record.get("AC_PHONE_NUMBER"),
        "agency_contact_description": record.get("AGENCY_CONTACT_DESC"),
        "agency_email_address": record.get("AC_EMAIL_ADDR"),
        "agency_email_address_description": record.get("AC_EMAIL_DESC"),
        "is_deleted": False,
        "can_send_mail": convert_yn_bool(record.get("SENDMAIL")),
        "publisher_profile_id": record.get("PUBLISHER_PROFILE_ID"),
        "publisher_user_id": record.get("PUBLISHERUID"),
        "updated_by": record.get("LAST_UPD_ID"),
        "created_by": record.get("CREATOR_ID"),
    }

def transform_synopsis(record: dict[str, str]) -> dict[str, str]:
    global summary_id
    summary_id += 1

    return {
        "opportunity_summary_id": summary_id,
        "opportunity_id": record.get("OPPORTUNITY_ID"),
        "summary_description": record.get("SYN_DESC"),
        "is_cost_sharing": convert_yn_bool(record.get("COST_SHARING")),
        "is_forecast": False,
        "post_date": record.get("POSTING_DATE"),
        "close_date": record.get("RESPONSE_DATE"),
        "close_date_description": record.get("RESPONSE_DATE_DESC"),
        "archive_date": record.get("ARCHIVE_DATE"),
        "unarchive_date": record.get("UNARCHIVE_DATE"),
        "expected_number_of_awards": convert_numeric(record.get("NUMBER_OF_AWARDS")),
        "estimated_total_program_funding": convert_numeric(record.get("EST_FUNDING")),
        "award_floor": convert_numeric(record.get("AWARD_FLOOR")),
        "award_ceiling": convert_numeric(record.get("AWARD_CEILING")),
        "additional_info_url": record.get("FD_LINK_URL"),
        "additional_info_url_description": record.get("FD_LINK_DESC"),
        "forecasted_post_date": None,
        "forecasted_close_date": None,
        "forecasted_close_date_description": None,
        "forecasted_award_date": None,
        "forecasted_project_start_date": None,
        "fiscal_year": None,
        "revision_number": None,
        "modification_comments": record.get("MODIFICATION_COMMENTS"),
        "funding_category_description": record.get("OTH_CAT_FA_DESC"),
        "agency_code": record.get("A_SA_CODE"),
        "agency_name": record.get("AC_NAME"),
        "agency_phone_number": record.get("AC_PHONE_NUMBER"),
        "agency_contact_description": record.get("AGENCY_CONTACT_DESC"),
        "agency_email_address": record.get("AC_EMAIL_ADDR"),
        "agency_email_address_description": record.get("AC_EMAIL_DESC"),
        "is_deleted": False,
        "can_send_mail": convert_yn_bool(record.get("SENDMAIL")),
        "publisher_profile_id": record.get("PUBLISHER_PROFILE_ID"),
        "publisher_user_id": record.get("PUBLISHERUID"),
        "updated_by": record.get("LAST_UPD_ID"),
        "created_by": record.get("CREATOR_ID"),
    }


def transform_cfda(record: dict[str, str]) -> dict[str, str]:
    return {
        "opportunity_assistance_listing_id": record.get("OPP_CFDA_ID"),
        "opportunity_id": record.get("OPPORTUNITY_ID"),
        "assistance_listing_number": record.get("CFDANUMBER"),
        "program_title": record.get("PROGRAMTITLE"),
        "updated_by": record.get("LAST_UPD_ID"),
        "created_by": record.get("CREATOR_ID"),
    }

def transform_applicant_types(record: dict[str, str], id_map: dict[str, str], is_forecast: bool) -> dict[str, str]:
    opportunity_id = record.get("OPPORTUNITY_ID")
    opportunity_summary_id = id_map.get(opportunity_id)

    # this is the primary key ID of the legacy record
    legacy_id = record.get("AT_FRCST_ID") if is_forecast else record.get("AT_SYN_ID")

    return {
        "opportunity_summary_id": opportunity_summary_id,
        "applicant_type_id": convert_legacy_applicant_type(record.get("AT_ID")),
        "legacy_applicant_type_id": legacy_id,
        "updated_by": record.get("LAST_UPD_ID"),
        "created_by": record.get("CREATOR_ID"),
    }

def transform_funding_category(record: dict[str, str], id_map: dict[str, str], is_forecast: bool) -> dict[str, str]:
    opportunity_id = record.get("OPPORTUNITY_ID")
    opportunity_summary_id = id_map.get(opportunity_id)

    # this is the primary key ID of the legacy record
    legacy_id = record.get("FAC_FRCST_ID") if is_forecast else record.get("FAC_SYN_ID")

    return {
        "opportunity_summary_id": opportunity_summary_id,
        "funding_category_id": convert_legacy_funding_category_type(record.get("FAC_ID")),
        "legacy_funding_category_id": legacy_id,
        "updated_by": record.get("LAST_UPD_ID"),
        "created_by": record.get("CREATOR_ID"),
    }

def transform_funding_instrument(record: dict[str, str], id_map: dict[str, str], is_forecast: bool) -> dict[str, str]:
    opportunity_id = record.get("OPPORTUNITY_ID")
    opportunity_summary_id = id_map.get(opportunity_id)

    # this is the primary key ID of the legacy record
    legacy_id = record.get("FI_FRCST_ID") if is_forecast else record.get("FI_SYN_ID")

    return {
        "opportunity_summary_id": opportunity_summary_id,
        "funding_instrument_id": convert_legacy_funding_instrument_type(record.get("FI_ID")),
        "legacy_funding_instrument_id": legacy_id,
        "updated_by": record.get("LAST_UPD_ID"),
        "created_by": record.get("CREATOR_ID"),
    }

def process():
    raw_opportunity_records = get_csv_records("TOPPORTUNITY")
    opportunity_records = [transform_opportunity(record) for record in raw_opportunity_records]

    opportunity_ids = {record.get("opportunity_id") for record in opportunity_records}

    write_csv("opportunity", opportunity_records)

    raw_forecast_records = get_csv_records("TFORECAST")
    forecast_records = [transform_forecast(record) for record in raw_forecast_records]
    raw_synopsis_records = get_csv_records("TSYNOPSIS")
    synopsis_records = [transform_synopsis(record) for record in raw_synopsis_records]
    write_csv("opportunity_summary", forecast_records + synopsis_records)

    raw_cfda_records = get_csv_records("TOPPORTUNITY_CFDA")
    cfda_records = []
    for record in raw_cfda_records:
        if record.get("OPPORTUNITY_ID") in opportunity_ids:
            cfda_records.append(transform_cfda(record))
    write_csv("opportunity_assistance_listing", cfda_records)

    # before we can process the link lookup tables, we need the new IDs
    # of the opportunity summary records that we created above.
    forecast_opportunity_id_to_summary_id_map = {}
    for record in forecast_records:
        forecast_opportunity_id_to_summary_id_map[record["opportunity_id"]] = record["opportunity_summary_id"]

    synopsis_opportunity_id_to_summary_id_map = {}
    for record in synopsis_records:
        synopsis_opportunity_id_to_summary_id_map[record["opportunity_id"]] = record["opportunity_summary_id"]

    # link_opportunity_summary_applicant_type
    raw_forecast_applicant_types = get_csv_records("TAPPLICANTTYPES_FORECAST")
    forecast_applicant_types = [transform_applicant_types(record, forecast_opportunity_id_to_summary_id_map, True) for record in raw_forecast_applicant_types]
    raw_synopsis_applicant_types = get_csv_records("TAPPLICANTTYPES_SYNOPSIS")
    synopsis_applicant_types = [transform_applicant_types(record, synopsis_opportunity_id_to_summary_id_map, False) for record in raw_synopsis_applicant_types]
    write_csv("link_opportunity_summary_applicant_type", forecast_applicant_types + synopsis_applicant_types)

    # link_opportunity_summary_funding_instrument
    raw_forecast_funding_instruments = get_csv_records("TFUNDINSTR_FORECAST")
    forecast_funding_instruments = [transform_funding_instrument(record, forecast_opportunity_id_to_summary_id_map, True) for record in raw_forecast_funding_instruments]
    raw_synopsis_funding_instruments = get_csv_records("TFUNDINSTR_SYNOPSIS")
    synopsis_funding_instruments = [transform_funding_instrument(record, synopsis_opportunity_id_to_summary_id_map, False) for record in raw_synopsis_funding_instruments]
    write_csv("link_opportunity_summary_funding_instrument", forecast_funding_instruments + synopsis_funding_instruments)

    # link_opportunity_summary_funding_category
    raw_forecast_funding_categories = get_csv_records("TFUNDACTCAT_FORECAST")
    forecast_funding_categories = [transform_funding_category(record, forecast_opportunity_id_to_summary_id_map, True) for record in raw_forecast_funding_categories]
    raw_synopsis_funding_categories = get_csv_records("TFUNDACTCAT_SYNOPSIS")
    synopsis_funding_categories = [transform_funding_category(record, synopsis_opportunity_id_to_summary_id_map, False) for record in raw_synopsis_funding_categories]
    write_csv("link_opportunity_summary_funding_category", forecast_funding_categories + synopsis_funding_categories)


def main():
    with src.logging.init("convert_oracle_csvs_to_postgres"):
        logger.info("Starting script")

        process()

        logger.info("Done")


main()