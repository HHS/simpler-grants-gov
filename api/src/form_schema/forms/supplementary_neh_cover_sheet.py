import uuid

from src.constants.lookup_constants import FormType
from src.db.models.competition_models import Form
from src.form_schema.shared import COMMON_SHARED_V1

# Mapping from display values to XSD numeric codes for project disciplines
# The XSD expects numeric string codes (e.g., "117" for "Arts: General")
PROJECT_DISCIPLINE_CODE_MAP = {
    "Arts: General": "117",
    "Arts: Architecture": "142",
    "Arts: Art History and Criticism": "110",
    "Arts: Dance History and Criticism": "112",
    "Arts: Film History and Criticism": "113",
    "Arts: History, Criticism, and Theory of the Arts": "2868",
    "Arts: Music History and Criticism": "114",
    "Arts: Theater History and Criticism": "111",
    "Arts: Other": "2869",
    "Communications: Communications": "124",
    "Communications: Composition and Rhetoric": "123",
    "Communications: Journalism": "126",
    "History: General": "1245",
    "History: African American History": "2836",
    "History: African History": "1246",
    "History: Ancient History": "13",
    "History: British History": "1247",
    "History: Classical History": "6",
    "History: Cultural History": "2837",
    "History: Diplomatic History": "2838",
    "History: East Asian History": "8",
    "History: Economic History": "2839",
    "History: European History": "7",
    "History: History of Science": "2835",
    "History: Immigration History": "2840",
    "History: Intellectual History": "2841",
    "History: Labor History": "2842",
    "History: Latin American History": "9",
    "History: Latino History": "2843",
    "History: Medieval History": "2833",
    "History: Military History": "2844",
    "History: Near and Middle Eastern History": "10",
    "History: Political History": "2845",
    "History: Public History": "2846",
    "History: Renaissance History": "2834",
    "History: Russian History": "11",
    "History: South Asian History": "12",
    "History: U.S. History": "4",
    "History: Urban History": "2847",
    "History: Women's History": "2848",
    "History: Other": "2849",
    "Interdisciplinary: General": "140",
    "Interdisciplinary: African American Studies": "104",
    "Interdisciplinary: African Studies": "89",
    "Interdisciplinary: American Studies": "76",
    "Interdisciplinary: Area Studies": "88",
    "Interdisciplinary: Asian American Studies": "105",
    "Interdisciplinary: Classics": "80",
    "Interdisciplinary: East Asian Studies": "2859",
    "Interdisciplinary: Ethnic Studies": "101",
    "Interdisciplinary: Folklore and Folklife": "129",
    "Interdisciplinary: Gender Studies": "74",
    "Interdisciplinary: Hispanic American Studies": "103",
    "Interdisciplinary: History and Philosophy of Science, Technology, and Medicine": "83",
    "Interdisciplinary: International Studies": "87",
    "Interdisciplinary: Jewish Studies": "106",
    "Interdisciplinary: Labor Relations": "77",
    "Interdisciplinary: Latin American Studies": "90",
    "Interdisciplinary: Media Studies": "125",
    "Interdisciplinary: Medieval Studies": "81",
    "Interdisciplinary: Native American Studies": "102",
    "Interdisciplinary: Renaissance Studies": "82",
    "Interdisciplinary: Rural Studies": "85",
    "Interdisciplinary: South Asian Studies": "2860",
    "Interdisciplinary: Turkish Studies": "79",
    "Interdisciplinary: U.S. Regional Studies": "86",
    "Interdisciplinary: Urban Studies": "75",
    "Interdisciplinary: Western Civilization": "84",
    "Interdisciplinary: Other": "2861",
    "Languages: General": "27",
    "Languages: Ancient Languages": "38",
    "Languages: Arabic Language": "2851",
    "Languages: Asian Languages": "36",
    "Languages: Classical Languages": "28",
    "Languages: Comparative Languages": "35",
    "Languages: Computational Linguistics": "2852",
    "Languages: English": "40",
    "Languages: French Language": "29",
    "Languages: German Language": "30",
    "Languages: Italian Language": "31",
    "Languages: Latin American Languages": "32",
    "Languages: Linguistics": "99",
    "Languages: Near and Middle Eastern Languages": "37",
    "Languages: Romance Languages": "39",
    "Languages: Slavic Languages": "33",
    "Languages: Spanish Language": "34",
    "Languages: Other": "2853",
    "Law: Law and Jurisprudence": "127",
    "Law: Legal History": "2870",
    "Literature: General": "42",
    "Literature: African Literature": "61",
    "Literature: American Literature": "55",
    "Literature: Ancient Literature": "53",
    "Literature: Arabic Literature": "57",
    "Literature: British Literature": "54",
    "Literature: Classical Literature": "43",
    "Literature: Comparative Literature": "50",
    "Literature: East Asian Literature": "2854",
    "Literature: French Literature": "44",
    "Literature: German Literature": "45",
    "Literature: Italian Literature": "46",
    "Literature: Latin American Literature": "47",
    "Literature: Literary Criticism": "59",
    "Literature: Near and Middle Eastern Literature": "52",
    "Literature: Russian Literature": "56",
    "Literature: Slavic Literature": "48",
    "Literature: South Asian Literature": "2855",
    "Literature: Spanish Literature": "49",
    "Literature: Other": "60",
    "Philosophy: General": "15",
    "Philosophy: Aesthetics": "16",
    "Philosophy: Epistemology": "1248",
    "Philosophy: Ethics": "1249",
    "Philosophy: History of Philosophy": "19",
    "Philosophy: Logic": "20",
    "Philosophy: Metaphysics": "21",
    "Philosophy: Non-Western Philosophy": "22",
    "Philosophy: Phenomenology - Existentialism": "24",
    "Philosophy: Philosophy of Language": "23",
    "Philosophy: Philosophy of Religion": "65",
    "Philosophy: Philosophy of Science": "25",
    "Philosophy: Other": "2850",
    "Politics: General": "69",
    "Politics: American Government": "70",
    "Politics: Comparative Politics": "2856",
    "Politics: International Relations": "71",
    "Politics: Political Theory": "2857",
    "Politics: Other": "2858",
    "Religion: General": "63",
    "Religion: Comparative Religion": "67",
    "Religion: History of Religion": "64",
    "Religion: Nonwestern Religion": "66",
    "Religion: Other": "2882",
    "Social Science: General": "141",
    "Social Science: Anthropology": "108",
    "Social Science: Archaeology": "145",
    "Social Science: Biological Anthropology": "2863",
    "Social Science: Cultural Anthropology": "2862",
    "Social Science: Economics": "119",
    "Social Science: Ethnomusicology": "2865",
    "Social Science: Geography": "146",
    "Social Science: Linguistic Anthropology": "2864",
    "Social Science: Psychology": "144",
    "Social Science: Sociology": "130",
    "Social Science: Other": "2866",
}

# Additional field of study codes (extending project discipline codes)
FIELD_OF_STUDY_CODE_MAP = {
    **PROJECT_DISCIPLINE_CODE_MAP,
    "Other: Archival Management and Conservation": "96",
    "Other: Business": "120",
    "Other: Computer Science": "2832",
    "Other: Conservation Science": "2871",
    "Other: Digital Humanities": "2872",
    "Other: Digital Preservation": "2873",
    "Other: Education": "92",
    "Other: Engineering": "2874",
    "Other: Filmmaking": "2875",
    "Other: Health Science": "2876",
    "Other: Information Science": "2877",
    "Other: Library Science": "94",
    "Other: Mathematics": "2878",
    "Other: Museum Studies or Historical Preservation": "97",
    "Other: Natural Sciences": "132",
    "Other: Public Administration": "72",
    "Other: Radio Production": "2880",
    "Other: Statistics": "2881",
}

# Note: Organization type values are passed through as-is (full "CODE: Description" format)
# The XSD expects the full value, not just the code number

PROJECT_DISCIPLINE_VALUES = [
    "Arts: General",  # 117
    "Arts: Architecture",  # 142
    "Arts: Art History and Criticism",  # 110
    "Arts: Dance History and Criticism",  # 112
    "Arts: Film History and Criticism",  # 113
    "Arts: History, Criticism, and Theory of the Arts",  # 2868
    "Arts: Music History and Criticism",  # 114
    "Arts: Theater History and Criticism",  # 111
    "Arts: Other",  # 2869
    "Communications: Communications",  # 124
    "Communications: Composition and Rhetoric",  # 123
    "Communications: Journalism",  # 126
    "History: General",  # 1245
    "History: African American History",  # 2836
    "History: African History",  # 1246
    "History: Ancient History",  # 13
    "History: British History",  # 1247
    "History: Classical History",  # 6
    "History: Cultural History",  # 2837
    "History: Diplomatic History",  # 2838
    "History: East Asian History",  # 8
    "History: Economic History",  # 2839
    "History: European History",  # 7
    "History: History of Science",  # 2835
    "History: Immigration History",  # 2840
    "History: Intellectual History",  # 2841
    "History: Labor History",  # 2842
    "History: Latin American History",  # 9
    "History: Latino History",  # 2843
    "History: Medieval History",  # 2833
    "History: Military History",  # 2844
    "History: Near and Middle Eastern History",  # 10
    "History: Political History",  # 2845
    "History: Public History",  # 2846
    "History: Renaissance History",  # 2834
    "History: Russian History",  # 11
    "History: South Asian History",  # 12
    "History: U.S. History",  # 4
    "History: Urban History",  # 2847
    "History: Women's History",  # 2848
    "History: Other",  # 2849
    "Interdisciplinary: General",  # 140
    "Interdisciplinary: African American Studies",  # 104
    "Interdisciplinary: African Studies",  # 89
    "Interdisciplinary: American Studies",  # 76
    "Interdisciplinary: Area Studies",  # 88
    "Interdisciplinary: Asian American Studies",  # 105
    "Interdisciplinary: Classics",  # 80
    "Interdisciplinary: East Asian Studies",  # 2859
    "Interdisciplinary: Ethnic Studies",  # 101
    "Interdisciplinary: Folklore and Folklife",  # 129
    "Interdisciplinary: Gender Studies",  # 74
    "Interdisciplinary: Hispanic American Studies",  # 103
    "Interdisciplinary: History and Philosophy of Science, Technology, and Medicine",  # 83
    "Interdisciplinary: International Studies",  # 87
    "Interdisciplinary: Jewish Studies",  # 106
    "Interdisciplinary: Labor Relations",  # 77
    "Interdisciplinary: Latin American Studies",  # 90
    "Interdisciplinary: Media Studies",  # 125
    "Interdisciplinary: Medieval Studies",  # 81
    "Interdisciplinary: Native American Studies",  # 102
    "Interdisciplinary: Renaissance Studies",  # 82
    "Interdisciplinary: Rural Studies",  # 85
    "Interdisciplinary: South Asian Studies",  # 2860
    "Interdisciplinary: Turkish Studies",  # 79
    "Interdisciplinary: U.S. Regional Studies",  # 86
    "Interdisciplinary: Urban Studies",  # 75
    "Interdisciplinary: Western Civilization",  # 84
    "Interdisciplinary: Other",  # 2861
    "Languages: General",  # 27
    "Languages: Ancient Languages",  # 38
    "Languages: Arabic Language",  # 2851
    "Languages: Asian Languages",  # 36
    "Languages: Classical Languages",  # 28
    "Languages: Comparative Languages",  # 35
    "Languages: Computational Linguistics",  # 2852
    "Languages: English",  # 40
    "Languages: French Language",  # 29
    "Languages: German Language",  # 30
    "Languages: Italian Language",  # 31
    "Languages: Latin American Languages",  # 32
    "Languages: Linguistics",  # 99
    "Languages: Near and Middle Eastern Languages",  # 37
    "Languages: Romance Languages",  # 39
    "Languages: Slavic Languages",  # 33
    "Languages: Spanish Language",  # 34
    "Languages: Other",  # 2853
    "Law: Law and Jurisprudence",  # 127
    "Law: Legal History",  # 2870
    "Literature: General",  # 42
    "Literature: African Literature",  # 61
    "Literature: American Literature",  # 55
    "Literature: Ancient Literature",  # 53
    "Literature: Arabic Literature",  # 57
    "Literature: British Literature",  # 54
    "Literature: Classical Literature",  # 43
    "Literature: Comparative Literature",  # 50
    "Literature: East Asian Literature",  # 2854
    "Literature: French Literature",  # 44
    "Literature: German Literature",  # 45
    "Literature: Italian Literature",  # 46
    "Literature: Latin American Literature",  # 47
    "Literature: Literary Criticism",  # 59
    "Literature: Near and Middle Eastern Literature",  # 52
    "Literature: Russian Literature",  # 56
    "Literature: Slavic Literature",  # 48
    "Literature: South Asian Literature",  # 2855
    "Literature: Spanish Literature",  # 49
    "Literature: Other",  # 60
    "Philosophy: General",  # 15
    "Philosophy: Aesthetics",  # 16
    "Philosophy: Epistemology",  # 1248
    "Philosophy: Ethics",  # 1249
    "Philosophy: History of Philosophy",  # 19
    "Philosophy: Logic",  # 20
    "Philosophy: Metaphysics",  # 21
    "Philosophy: Non-Western Philosophy",  # 22
    "Philosophy: Phenomenology - Existentialism",  # 24
    "Philosophy: Philosophy of Language",  # 23
    "Philosophy: Philosophy of Religion",  # 65
    "Philosophy: Philosophy of Science",  # 25
    "Philosophy: Other",  # 2850
    "Politics: General",  # 69
    "Politics: American Government",  # 70
    "Politics: Comparative Politics",  # 2856
    "Politics: International Relations",  # 71
    "Politics: Political Theory",  # 2857
    "Politics: Other",  # 2858
    "Religion: General",  # 63
    "Religion: Comparative Religion",  # 67
    "Religion: History of Religion",  # 64
    "Religion: Nonwestern Religion",  # 66
    "Religion: Other",  # 2882
    "Social Science: General",  # 141
    "Social Science: Anthropology",  # 108
    "Social Science: Archaeology",  # 145
    "Social Science: Biological Anthropology",  # 2863
    "Social Science: Cultural Anthropology",  # 2862
    "Social Science: Economics",  # 119
    "Social Science: Ethnomusicology",  # 2865
    "Social Science: Geography",  # 146
    "Social Science: Linguistic Anthropology",  # 2864
    "Social Science: Psychology",  # 144
    "Social Science: Sociology",  # 130
    "Social Science: Other",  # 2866
]

FIELD_OF_STUDY_VALUES = [
    "Other: Archival Management and Conservation",  # 96
    "Other: Business",  # 120
    "Other: Computer Science",  # 2832
    "Other: Conservation Science",  # 2871
    "Other: Digital Humanities",  # 2872
    "Other: Digital Preservation",  # 2873
    "Other: Education",  # 92
    "Other: Engineering",  # 2874
    "Other: Filmmaking",  # 2875
    "Other: Health Science",  # 2876
    "Other: Information Science",  # 2877
    "Other: Library Science",  # 94
    "Other: Mathematics",  # 2878
    "Other: Museum Studies or Historical Preservation",  # 97
    "Other: Natural Sciences",  # 132
    "Other: Public Administration",  # 72
    "Other: Radio Production",  # 2880
    "Other: Statistics",  # 2881
]

ORGANIZATION_TYPES = [
    "1326: Center For Advanced Study/Research Institute",
    "1327: Publishing",
    "1328: Two-Year College",
    "1329: Four-Year College",
    "1330: University",
    "1331: Professional School",
    "1332: Elementary/Middle School",
    "1333: Secondary School",
    "1334: School District",
    "1335: State Department of Education",
    "1336: Non-Profit Educational Center",
    "1337: Educational Consortium",
    "1338: Philanthropic Foundation",
    "1339: State/Local/Federal Government",
    "1340: Historical Society",
    "1341: Archives",
    "1342: Historical Site/House",
    "1343: Historic Preservation Organization",
    "1344: Public Library",
    "1345: Academic Library",
    "1346: Independent Research Library",
    "1347: History Museum",
    "1348: Natural History Museum",
    "1349: Art Museum",
    "1350: University Museum",
    "1351: Anthropology/Archaeology Museum",
    "1352: Science and Technology Museum",
    "1353: General Museum",
    "1354: Nature Center/Botanical Garden/Arboretum",
    "1355: National Organization",
    "1356: State Humanities Council",
    "1357: Community-Level Organization",
    "1358: Indian Tribal Organization",
    "1359: Professional Association",
    "1360: Arts Related Organizations",
    "1361: Television/Station",
    "1362: Radio Station",
    "1363: Independent Production Company",
    "1364: Press",
    "2786: Museums",
    "2787: Libraries",
    "2819: Unknown",
]

FORM_JSON_SCHEMA = {
    "type": "object",
    "required": [
        "major_field",
        "organization_type",
        "funding_group",
        "application_info",
    ],
    "properties": {
        "major_field": {
            "allOf": [{"$ref": "#/$defs/field_of_study"}],
            "title": "Major Field of Study",
        },
        "organization_type": {"type": "string", "title": "Type", "enum": ORGANIZATION_TYPES},
        "funding_group": {
            "type": "object",
            "required": [],
            # Conditional field validation
            "allOf": [
                ### These two rules go together and make sure that one of
                ### outright_funds and federal_match is provided.
                #
                # If outright_funds is not present, then federal_match is required
                {
                    "if": {"not": {"required": ["outright_funds"]}},
                    "then": {"required": ["federal_match"]},
                },
                # If federal_match is not present, then outright_funds is required
                {
                    "if": {"not": {"required": ["federal_match"]}},
                    "then": {"required": ["outright_funds"]},
                },
            ],
            "properties": {
                "outright_funds": {
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("budget_monetary_amount")}],
                    "title": "Outright Funds",
                },
                "federal_match": {
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("budget_monetary_amount")}],
                    "title": "Federal Match",
                },
                "total_from_neh": {
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("budget_monetary_amount")}],
                    "title": "Total from NEH",
                },
                "cost_sharing": {
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("budget_monetary_amount")}],
                    "title": "Cost Sharing",
                },
                "total_project_costs": {
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("budget_monetary_amount")}],
                    "title": "Total Project Costs",
                },
            },
        },
        "application_info": {
            "type": "object",
            "required": ["additional_funding", "application_type", "primary_project_discipline"],
            # Conditional validation rules for application info
            "allOf": [
                # If additional_funding is True, additional_funding_explanation is required
                {
                    "if": {
                        "properties": {"additional_funding": {"const": True}},
                        # Only run rule if additional_funding is set
                        "required": ["additional_funding"],
                    },
                    "then": {"required": ["additional_funding_explanation"]},
                },
                # If application_type is Supplement, supplemental_grant_numbers is required
                {
                    "if": {
                        "properties": {"application_type": {"const": "Supplement"}},
                        # Only run rule if application_type is set
                        "required": ["application_type"],
                    },
                    "then": {"required": ["supplemental_grant_numbers"]},
                },
            ],
            "properties": {
                "additional_funding": {
                    "type": "boolean",
                    "title": "Additional Funding",
                    "description": "Will this proposal be submitted to another NEH division, government agency, or private entity for funding?",
                },
                "additional_funding_explanation": {
                    "type": "string",
                    "title": "Additional Funding Explanation",
                    "description": "If yes, please explain where and when:",
                    "minLength": 1,
                    "maxLength": 50,
                },
                "application_type": {
                    "type": "string",
                    "enum": ["New", "Supplement"],
                    "title": "Type of Application",
                },
                "supplemental_grant_numbers": {
                    "type": "string",
                    "title": "Supplemental Grant Numbers",
                    "description": "if supplement, list current grant number(s)",
                    "minLength": 1,
                    "maxLength": 50,
                },
                "primary_project_discipline": {
                    "allOf": [{"$ref": "#/$defs/project_discipline"}],
                    "title": "Primary Project Discipline",
                },
                "secondary_project_discipline": {
                    "allOf": [{"$ref": "#/$defs/project_discipline"}],
                    "title": "Secondary Project Discipline (optional)",
                },
                "tertiary_project_discipline": {
                    "allOf": [{"$ref": "#/$defs/project_discipline"}],
                    "title": "Tertiary Project Discipline (optional)",
                },
            },
        },
    },
    "$defs": {
        # Project discipline / Field of study in the XML is an integer, but
        # has a display value in the PDF/webform. We
        # use the display value in our schema, but the
        # number next to each field is the XML value we
        # need to transform it to.
        # NOTE - while most of the values are shared between
        # these two values, field of study has an extra 20
        # or so fields at the end.
        "project_discipline": {"type": "string", "enum": PROJECT_DISCIPLINE_VALUES},
        "field_of_study": {
            "type": "string",
            "enum": PROJECT_DISCIPLINE_VALUES + FIELD_OF_STUDY_VALUES,
        },
    },
}

FORM_UI_SCHEMA = [
    {
        "type": "section",
        "label": "1. Project Director",
        "name": "Project Director",
        "children": [{"type": "field", "definition": "/properties/major_field"}],
    },
    {
        "type": "section",
        "label": "2. Institution Information",
        "name": "Institution Information",
        "children": [{"type": "field", "definition": "/properties/organization_type"}],
    },
    {
        "type": "section",
        "label": "3. Project Funding",
        "name": "Project Funding",
        "description": "A non-zero amount is required for either Outright Funds or Federal Match.",
        "children": [
            {"type": "field", "definition": "/properties/funding_group/properties/outright_funds"},
            {"type": "field", "definition": "/properties/funding_group/properties/federal_match"},
            {"type": "null", "definition": "/properties/funding_group/properties/total_from_neh"},
            {"type": "field", "definition": "/properties/funding_group/properties/cost_sharing"},
            {
                "type": "null",
                "definition": "/properties/funding_group/properties/total_project_costs",
            },
        ],
    },
    {
        "type": "section",
        "label": "4. Application Information",
        "name": "Application Information",
        "children": [
            {
                "type": "field",
                "widget": "Radio",
                "definition": "/properties/application_info/properties/additional_funding",
            },
            {
                "type": "field",
                "definition": "/properties/application_info/properties/additional_funding_explanation",
            },
            {
                "type": "field",
                "definition": "/properties/application_info/properties/application_type",
            },
            {
                "type": "field",
                "definition": "/properties/application_info/properties/supplemental_grant_numbers",
            },
            {
                "type": "field",
                "definition": "/properties/application_info/properties/primary_project_discipline",
            },
            {
                "type": "field",
                "definition": "/properties/application_info/properties/secondary_project_discipline",
            },
            {
                "type": "field",
                "definition": "/properties/application_info/properties/tertiary_project_discipline",
            },
        ],
    },
]

FORM_RULE_SCHEMA = {
    "funding_group": {
        # Total from NEH is the sum of Outright Funds + Federal Match
        "total_from_neh": {
            "gg_pre_population": {
                "rule": "sum_monetary",
                "fields": ["funding_group.outright_funds", "funding_group.federal_match"],
            }
        },
        # Total Project Costs is the sum of Total from NEH + Cost Sharing
        "total_project_costs": {
            "gg_pre_population": {
                "rule": "sum_monetary",
                "fields": ["funding_group.total_from_neh", "funding_group.cost_sharing"],
                # This rule needs to run after we calculate the total_from_neh
                "order": 2,
            }
        },
    }
}

# XML transformation rules for generating Grants.gov-compatible XML
# XSD reference: https://apply07.grants.gov/apply/forms/schemas/SupplementaryCoverSheetforNEHGrantPrograms_3_0-V3.0.xsd
FORM_XML_TRANSFORM_RULES = {
    "_xml_config": {
        "description": "XML transformation rules for Supplementary Cover Sheet for NEH Grant Programs",
        "form_name": "SupplementaryCoverSheetforNEHGrantPrograms_3_0",
        "namespaces": {
            "default": "http://apply.grants.gov/forms/SupplementaryCoverSheetforNEHGrantPrograms_3_0-V3.0",
            "SupplementaryCoverSheetforNEHGrantPrograms_3_0": (
                "http://apply.grants.gov/forms/SupplementaryCoverSheetforNEHGrantPrograms_3_0-V3.0"
            ),
            "att": "http://apply.grants.gov/system/Attachments-V1.0",
            "glob": "http://apply.grants.gov/system/Global-V1.0",
            "globLib": "http://apply.grants.gov/system/GlobalLibrary-V2.0",
        },
        "xsd_url": (
            "https://apply07.grants.gov/apply/forms/schemas/"
            "SupplementaryCoverSheetforNEHGrantPrograms_3_0-V3.0.xsd"
        ),
        "xml_structure": {
            "root_element": "SupplementaryCoverSheetforNEHGrantPrograms_3_0",
            "root_namespace_prefix": "SupplementaryCoverSheetforNEHGrantPrograms_3_0",
            "root_attributes": {"FormVersion": "3.0"},
        },
    },
    # Field mappings (order matches XSD sequence)
    # 1. PDMajorField - Project Director's Major Field of Study
    "major_field": {
        "xml_transform": {
            "target": "PDMajorField",
            "value_transform": {
                "type": "map_values",
                "params": {"mappings": FIELD_OF_STUDY_CODE_MAP},
            },
        }
    },
    # 2. InstType - Institution/Organization Type
    # Note: Organization type is passed through as-is (full "CODE: Description" format)
    "organization_type": {
        "xml_transform": {
            "target": "OrganizationType",
        }
    },
    # 3. ProjectFunding - Nested structure for funding amounts
    "funding_group": {
        "xml_transform": {
            "target": "ProjectFundingGroup",
            "type": "nested_object",
        },
        "outright_funds": {
            "xml_transform": {
                "target": "ReqOutrightAmount",
                "value_transform": {"type": "currency_format"},
            }
        },
        "federal_match": {
            "xml_transform": {
                "target": "ReqMatchAmount",
                "value_transform": {"type": "currency_format"},
            }
        },
        "total_from_neh": {
            "xml_transform": {
                "target": "TotalFromNEH",
                "value_transform": {"type": "currency_format"},
            }
        },
        "cost_sharing": {
            "xml_transform": {
                "target": "CostSharing",
                "value_transform": {"type": "currency_format"},
            }
        },
        "total_project_costs": {
            "xml_transform": {
                "target": "TotalProjectCosts",
                "value_transform": {"type": "currency_format"},
            }
        },
    },
    # 4. ApplicationInfo - Nested structure for application information
    "application_info": {
        "xml_transform": {
            "target": "ApplicationInfoGroup",
            "type": "nested_object",
        },
        "additional_funding": {
            "xml_transform": {
                "target": "AdditionalFunding",
                "value_transform": {
                    "type": "map_values",
                    "params": {"mappings": {"True": "Yes", "False": "No"}},
                },
            }
        },
        "additional_funding_explanation": {
            "xml_transform": {
                "target": "AdditionalFundingExplanation",
            }
        },
        "application_type": {
            "xml_transform": {
                "target": "TypeofApplication",
            }
        },
        "supplemental_grant_numbers": {
            "xml_transform": {
                "target": "SupplementalGrantNumber",
            }
        },
        # 5. Primary Project Discipline (moved inside ApplicationInfoGroup for XML)
        "primary_project_discipline": {
            "xml_transform": {
                "target": "ProjFieldCode",
                "value_transform": {
                    "type": "map_values",
                    "params": {"mappings": PROJECT_DISCIPLINE_CODE_MAP},
                },
            }
        },
        # 6. SecondaryPDNEH - Secondary Project Discipline (optional)
        "secondary_project_discipline": {
            "xml_transform": {
                "target": "SecondaryProjFieldCode",
                "value_transform": {
                    "type": "map_values",
                    "params": {"mappings": PROJECT_DISCIPLINE_CODE_MAP},
                },
            }
        },
        # 7. TertiaryPDNEH - Tertiary Project Discipline (optional)
        "tertiary_project_discipline": {
            "xml_transform": {
                "target": "TertiaryProjFieldCode",
                "value_transform": {
                    "type": "map_values",
                    "params": {"mappings": PROJECT_DISCIPLINE_CODE_MAP},
                },
            }
        },
    },
}

SupplementaryNEHCoverSheet_v3_0 = Form(
    # https://grants.gov/forms/form-items-description/fid/530
    form_id=uuid.UUID("b0541e24-3fd5-444e-99ac-ba4a764582ed"),
    legacy_form_id=530,
    form_name="Supplementary Cover Sheet for NEH Grant Programs",
    short_form_name="SupplementaryCoverSheetforNEHGrantPrograms",
    form_version="3.0",
    agency_code="SGG",
    omb_number=None,
    form_json_schema=FORM_JSON_SCHEMA,
    form_ui_schema=FORM_UI_SCHEMA,
    form_rule_schema=FORM_RULE_SCHEMA,
    json_to_xml_schema=FORM_XML_TRANSFORM_RULES,
    # No instructions
    form_type=FormType.SUPPLEMENTARY_NEH_COVER_SHEET,
    sgg_version="1.0",
    is_deprecated=False,
)
