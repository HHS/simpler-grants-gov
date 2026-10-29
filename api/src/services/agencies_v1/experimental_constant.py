DEFAULT = [
    "agency_name",
    # the unstemmed copies of the name fields keep partially typed words matching,
    # see AGENCY_INDEX_ANALYSIS in src/search/backend/load_agencies_to_index.py
    "agency_name.unstemmed",
    "agency_code",
    "agency_code.keyword",
    "top_level_agency.agency_name",
    "top_level_agency.agency_name.unstemmed",
    "top_level_agency.agency_code",
]
